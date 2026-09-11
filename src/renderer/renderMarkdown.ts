import {Config} from "../config/config";
import {AuthNotice} from "../connectors/authNotice";
import {renderFunc} from "./index";
import {createHash} from "node:crypto";
import path from "node:path";
import TurndownService from "turndown";
import {tables} from "turndown-plugin-gfm";

function makeTitleFilenameSafe(title: string) {
    const replacements: Record<string, string> = {
        '/': '∕',
        '\\': '＼',
        ':': 'ː',
        '*': '',
        '?': 'ʔ',
        '"': '″',
        '<': '‹',
        '>': '›',
        '|': '｜'
    };


    return title.replace(/[\/\\?*:|"<>]/g, (match): string => replacements[match] || '_');
}

function normalizeThreadTitle(title: string): string {
    let normalized = title;
    let stripped: string;
    do {
        stripped = normalized.replace(/^\s*(re|fwd?|fw)\s*:\s*/i, "").trim();
        if (stripped === normalized) break;
        normalized = stripped;
    } while (normalized.length > 0);

    return normalized || title;
}

function createTurndownService(plainMarkdown: boolean) {
    const service = new TurndownService();

    service.remove(["style", "script", "head", "meta", "title"]);
    service.use(tables);
    service.addRule("emptyTable", {
        filter: (node) => node.nodeName === "TABLE" && (node as HTMLTableElement).rows.length === 0,
        replacement: (content) => content
    });
    if (plainMarkdown) {
        service.addRule("forceMarkdownTable", {
            filter: (node) => node.nodeName === "TABLE" && (node as HTMLTableElement).rows.length > 0,
            replacement: (content) => {
                content = content.replace("\n\n", "\n");
                return "\n\n" + content + "\n\n";
            }
        });
    }
    service.addRule("img", {
        filter: "img",
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const alt = el.getAttribute("alt") ?? "";
            const src = el.getAttribute("src") ?? "";
            return src ? `![${alt}](${src})` : "";
        }
    });

    return service;
}

const turndownService = createTurndownService(false);
const turndownServicePlainMarkdown = createTurndownService(true);

export async function renderMarkdownFiles(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void, options?: { plainMarkdown?: boolean }) {
    const dataArray = await renderFunc(config, onAuthNotice);
    const service = options?.plainMarkdown ? turndownServicePlainMarkdown : turndownService;


    const threadCounts = new Map<string, number>();
    for (const data of dataArray) {
        const threadId = data.kind === "email" ? data.EmailExtras?.threadId : undefined;
        if (!threadId) continue;
        threadCounts.set(threadId, (threadCounts.get(threadId) ?? 0) + 1);
    }

    return dataArray.map((data) => {
        const bodyContent = data.bodyFormat === "html" ? service.turndown(data.body ?? "") : data.body ?? "*No body was provided.*";

        const frontmatter = [
            `provider: ${data.provider}`,
            `kind: ${data.kind}`,
            `external_id: "${data.externalId}"`,
            `source_url: "${data.sourceUrl}"`,
            `created_at: "${data.createdAt}"`,
            `updated_at: "${data.updatedAt}"`,
            `synced_at: "${data.syncedAt}"`,
        ];
        if (data.CalendarExtra) {
            frontmatter.push(`start_date: "${data.CalendarExtra.startDate}"`, `end_date: "${data.CalendarExtra.endDate}"`);
        }
        if (data.EmailExtras) {
            frontmatter.push(`to: "${data.EmailExtras.to}"`);
            if (data.EmailExtras.threadId) frontmatter.push(`thread_id: "${data.EmailExtras.threadId}"`);
            if (data.EmailExtras.cc) frontmatter.push(`cc: "${data.EmailExtras.cc}"`);
            if (data.EmailExtras.bcc) frontmatter.push(`bcc: "${data.EmailExtras.bcc}"`);
        }
        if (data.issueNumber !== undefined) frontmatter.push(`issue_number: "${data.issueNumber}"`);
        if (data.repo) frontmatter.push(`repo: "${data.repo}"`);

        const content = `---\n${frontmatter.join("\n")}\n---\n\n# ${data.title}\n\n${bodyContent}`;

        const kind = data.kind;

        const sanitizedTitle = makeTitleFilenameSafe(data.title);
        const uniqueId = createHash('sha256').update(`${data.provider}:${data.kind}:${data.externalId}`).digest('hex').slice(0, 8);
        const filename = sanitizedTitle + "--" + uniqueId + ".md";

        const threadId = data.kind === "email" ? data.EmailExtras?.threadId : undefined;
        if (!threadId || (threadCounts.get(threadId) ?? 0) < 2) {
            return {filename, content, kind};
        }

        const threadFolderTitle = makeTitleFilenameSafe(normalizeThreadTitle(data.title));
        const threadHash = createHash('sha256').update(`${data.provider}:${threadId}`).digest('hex').slice(0, 8);
        const threadFolder = threadFolderTitle + "--" + threadHash;
        const lowercaseTitle = threadFolder.toLowerCase()

        return {filename: path.join(lowercaseTitle, filename), content, kind};
    });
}
