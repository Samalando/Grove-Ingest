import {Composio} from "@composio/core";

import {Config} from "../../config/config";
import {AuthNotice} from "../authNotice";
import {invalidateComposioKeyIfStale} from "../authError";

const CATEGORY_QUERY_OPERATORS: Record<string, string> = {
    INBOX: "in:inbox",
    SPAM: "in:spam",
    TRASH: "in:trash",
    UNREAD: "is:unread",
    STARRED: "is:starred",
    IMPORTANT: "is:important",
    CATEGORY_PRIMARY: "category:primary",
    CATEGORY_SOCIAL: "category:social",
    CATEGORY_PROMOTIONS: "category:promotions",
    CATEGORY_UPDATES: "category:updates",
    CATEGORY_FORUMS: "category:forums",
};

function formatGmailDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, "/");
}

function buildGmailQuery(categories?: string[], start?: Date, end?: Date): string | undefined {
    const parts: string[] = [];
    if (categories?.length) {
        const categoryQuery = categories.map((category) => CATEGORY_QUERY_OPERATORS[category] ?? category).join(" OR ");
        parts.push(categories.length > 1 ? `(${categoryQuery})` : categoryQuery);
    }
    if (start) parts.push(`after:${formatGmailDate(start)}`);
    if (end) parts.push(`before:${formatGmailDate(end)}`);
    return parts.length ? parts.join(" ") : undefined;
}

export async function gmailRun(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    if (config === undefined || config.google?.type === undefined) {
        throw new Error("config is undefined");
    }
    let me
    if (config.google?.type === "gmail") {
        me = config.google.gmail;
    }

    if (config.spike.type === "composio") {
        try {
            const composio = new Composio({
                apiKey: config.spike.composioApiKey,
            });

            const session = await composio.create(config.spike.username);

            const toolkits = await session.toolkits();
            const gmail = toolkits.items.find(t => t.slug === 'gmail');

            if (!gmail?.connection?.isActive) {
                const auth = await session.authorize('gmail');
                console.log(auth.redirectUrl);
                if (auth.redirectUrl) onAuthNotice?.({ url: auth.redirectUrl });
                await auth.waitForConnection();
                onAuthNotice?.(null);
            }

            const result = await session.execute('GMAIL_FETCH_EMAILS', {
                max_results: me?.maxResults ?? 30,
                include_payload: true,
                query: buildGmailQuery(me?.categories, me?.start, me?.end),
            });
            const resultAttachments = "h"
            console.log((JSON.stringify(result, null, 2)) as any);
            return result.data;
        } catch (error) {
            await invalidateComposioKeyIfStale(error);
            throw error;
        }
    }
}
