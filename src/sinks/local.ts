import * as fs from 'fs';
import {Config} from "../config/config";
import * as path from "node:path";
import {renderFunc} from "../renderer";

function makeTitleFilenameSafe(title: string) {
    const replacements = {
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
export async function toMarkdown(config: Config) {

    const dataArray = await renderFunc(config);


    for (const data of dataArray) {
        const bodyContent = data.body !== null ? data.body : "*No body was provided.*";

        const markdown = `---
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


        const itemPath = path.join(config.outputDir, data.provider + " --" + sanitizedTitle + ".md");

        fs.writeFileSync(itemPath, markdown);
    }
}