import { gmailRun } from "../../connectors/gmail/composio";
import { MarkdownConfig } from "../markdown";
import { Config } from "../../config/config";
import TurndownService from "turndown"

const turndownService = new TurndownService();
turndownService.remove(["style", "script", "head", "meta", "title"]);
turndownService.addRule("img", {
    filter: "img",
    replacement: (_content, node) => (node as HTMLElement).outerHTML
});
turndownService.keep(["table", "tbody", "thead", "tr", "td", "th"]);

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

export async function gmailMessagesRun(config: Config): Promise<MarkdownConfig[]> {
    const now: Date = new Date();
    const isoString: string = now.toISOString();

    const result: any = await gmailRun(config);
    const messages = result?.messages ?? [];

    return messages.map((message: any): MarkdownConfig => {
        const htmlData = message.payload ? findHtmlBody(message.payload) : undefined;
        const html = htmlData
            ? Buffer.from(htmlData, "base64url").toString("utf-8")
            : undefined;
        let markdownBody = html ? turndownService.turndown(html) : undefined


        return {
            provider: "gmail",
            externalId: message.messageId,
            sourceUrl: message.display_url,
            title: message.subject,
            body: markdownBody ?? message.messageText ?? null,
            createdAt: message.messageTimestamp,
            updatedAt: message.messageTimestamp,
            syncedAt: isoString,
            kind: "email",
            EmailExtras:{
                to: message.to
            }
        };
    });
}
