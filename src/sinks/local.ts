import * as fs from 'fs';
import {Config} from "../config/config";
import * as path from "node:path";
import {renderFunc} from "../renderer";
import {AuthNotice} from "../connectors/authNotice";
import { createHash } from 'node:crypto'

function makeTitleFilenameSafe(title: string) {
    const replacements: Record<string, string> = {
        '/': '∕',
        '\\': '＼',
        ':': 'ː',
        '*': '⁎',
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

        const sanitizedTitle = makeTitleFilenameSafe(data.title);
        const uniqueId = createHash('sha256').update(`${data.provider}:${data.kind}:${data.externalId}`).digest('hex').slice(0, 8);
        const filename = sanitizedTitle + " -- " + uniqueId + ".md";

        const threadId = data.kind === "email" ? data.EmailExtras?.threadId : undefined;
        if (!threadId || (threadCounts.get(threadId) ?? 0) < 2) {
            return { filename, content };
        }

        const threadFolderTitle = makeTitleFilenameSafe(normalizeThreadTitle(data.title));
        const threadHash = createHash('sha256').update(`${data.provider}:${threadId}`).digest('hex').slice(0, 8);
        const threadFolder = threadFolderTitle + " -- " + threadHash;

        return { filename: path.join(threadFolder, filename), content };
    });
}

export async function toLocalMarkdown(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const files = await renderMarkdownFiles(config, onAuthNotice);

    for (const file of files) {
        const fullPath = path.join(config.outputDir, file.filename);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, file.content);
    }

    return files.length;
}