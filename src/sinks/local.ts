import {run} from "../renderer/github/prs";
import * as fs from 'fs';
import {Config} from "../config/config";
import * as path from "node:path";

export async function toMarkdown(config: Config) {

    const dataArray = await run(config);


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

        console.log(`Writing markdown for: ${data.title}`);

        const itemPath = path.join(config.outputDir, data.externalId + ".md");

        fs.writeFileSync(itemPath, markdown);
    }
}