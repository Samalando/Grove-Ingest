import {Config} from "../config/config";
import * as path from "node:path";
import {renderFunc} from "../renderer";
import {AuthNotice} from "../connectors/authNotice";
import { createHash } from 'node:crypto'

function makeTitleFilenameSafe(title: string) {
    const replacements: Record<string, string> = {
        '/': '_',
        '\\': '_',
        ':': '_',
        '*': '_',
        '?': '_',
        '"': '_',
        '<': '_',
        '>': '_',
        '|': '_',
        ' ': '_'
    };


    return title.replace(/[\/\\? *:|"<>]/g, (match): string => replacements[match] || '_');
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

export async function renderMarkdownFiles(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const dataArray = await renderFunc(config, onAuthNotice);

    const threadCounts = new Map<string, number>();
    for (const data of dataArray) {
        const threadId = data.kind === "email" ? data.EmailExtras?.threadId : undefined;
        if (!threadId) continue;
        threadCounts.set(threadId, (threadCounts.get(threadId) ?? 0) + 1);
    }

    return dataArray.map((data) => {
        const bodyContent = data.body !== null ? data.body : "*No body was provided.*";

        const content = `---
provider: ${data.provider}
kind: ${data.kind}
external_id: "${data.externalId}"
source_url: "${data.sourceUrl}"
created_at: "${data.createdAt}"
updated_at: "${data.updatedAt}"
synced_at: "${data.syncedAt}"
---

# ${data.title}

${bodyContent}`;
        const kind = data.kind;

        const sanitizedTitle = data.title;
        const uniqueId = createHash('sha256').update(`${data.provider}:${data.kind}:${data.externalId}`).digest('hex').slice(0, 8);
        const filename = sanitizedTitle + "--" + uniqueId + ".md";

        const threadId = data.kind === "email" ? data.EmailExtras?.threadId : undefined;
        if (!threadId || (threadCounts.get(threadId) ?? 0) < 2) {
            return { filename, content, kind };
        }

        const threadFolderTitle = makeTitleFilenameSafe(normalizeThreadTitle(data.title));
        const threadHash = createHash('sha256').update(`${data.provider}:${threadId}`).digest('hex').slice(0, 8);
        const threadFolder = threadFolderTitle + "--" + threadHash;
        const lowercaseTitle = threadFolder.toLowerCase()

        return { filename: path.join(lowercaseTitle, filename), content, kind};
    });
}

export async function toGroveMarkdown(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const files = await renderMarkdownFiles(config, onAuthNotice);

    for (const file of files) {
        const res = await fetch(`http://localhost:8123/grove/ingest/${file.kind}/${file.filename}`, {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Cookie": config.sinks.grove.cookie ?? "",
            },
            body: file.content,
        });

        if (!res.ok) {
            throw new Error(`Grove write failed for ${file.filename}: ${res.status} ${res.statusText}`);
        }
    }

    return files.length;
}