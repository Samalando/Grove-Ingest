import * as fs from 'fs';
import {Config} from "../config/config";
import * as path from "node:path";
import {renderFunc} from "../renderer";
import {AuthNotice} from "../connectors/authNotice";

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

export async function renderMarkdownFiles(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const dataArray = await renderFunc(config, onAuthNotice);

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
        const sanitizedId = makeTitleFilenameSafe(data.externalId);
        const filename = data.provider + " --" + sanitizedTitle + " --" + sanitizedId + ".md";

        return { filename, content };
    });
}

export async function toMarkdown(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const files = await renderMarkdownFiles(config, onAuthNotice);

    for (const file of files) {
        fs.writeFileSync(path.join(config.outputDir, file.filename), file.content);
    }

    return files.length;
}