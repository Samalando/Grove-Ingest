import { gmailRun } from "../../connectors/gmail/composio";
import { MarkdownConfig } from "../markdown";
import { Config } from "../../config/config";
import { AuthNotice } from "../../connectors/authNotice";


function findHtmlBody(part: any): string | undefined {
    if (part.mimeType === "text/html" && part.body?.data) {
        return part.body.data;
    }
    for (const child of part.parts ?? []) {
        const found = findHtmlBody(child);
        if (found) return found;
    }
    return undefined;
}

export async function gmailMessagesRun(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void): Promise<MarkdownConfig[]> {
    const now: Date = new Date();
    const isoString: string = now.toISOString();

    const result: any = await gmailRun(config, onAuthNotice);
    const messages = result?.messages ?? [];

    return messages.map((message: any): MarkdownConfig => {
        const htmlData = message.payload ? findHtmlBody(message.payload) : undefined;
        const html = htmlData
            ? Buffer.from(htmlData, "base64url").toString("utf-8")
            : undefined;


        return {
            provider: "gmail",
            externalId: message.messageId,
            sourceUrl: message.display_url,
            title: message.subject,
            body: html ?? message.messageText ?? null,
            createdAt: message.messageTimestamp,
            updatedAt: message.messageTimestamp,
            syncedAt: isoString,
            bodyFormat: html ? "html" : "text",
            kind: "email",
            EmailExtras:{
                to: message.to,
                threadId: message.threadId
            }
        };
    });
}
