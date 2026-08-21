import { gmailRun } from "../../connectors/gmail/composio";
import { MarkdownConfig } from "../markdown";
import { Config } from "../../config/config";
import { AuthNotice } from "../../connectors/authNotice";
import TurndownService from "turndown"

const turndownService = new TurndownService();
turndownService.remove(["style", "script", "head", "meta", "title"]);
turndownService.addRule("img", {
    filter: "img",
    replacement: (_content, node) => {
        const el = node as HTMLElement;
        el.removeAttribute("width");
        el.removeAttribute("height");
        el.style.removeProperty("width");
        el.style.removeProperty("height");
        el.style.maxWidth = "100%";
        el.style.height = "auto";
        return el.outerHTML;
    }
});
turndownService.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
        const el = node as HTMLElement;
        el.removeAttribute("width");
        el.style.removeProperty("width");
        el.style.maxWidth = "100%";
        el.style.width = "100%";
        return el.outerHTML;
    }
});
turndownService.keep(["tbody", "thead", "tr", "td", "th"]);

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
                to: message.to,
                threadId: message.threadId
            }
        };
    });
}
