import {run} from "../renderer/github/prs";
import * as fs from 'fs';
import {Config} from "../config/config";
import * as path from "node:path";

export async function toMarkdown(config: Config) {

    const dataArray = await run(config);


    for (const data of dataArray) {
        const markdown =
            "---\n" +
            `provider: ${data.provider}\n` +
            `kind: ${data.kind}\n` +
            `external_id: "${data.externalId}"\n` +
            `source_url: "${data.sourceUrl}"\n` +
            `created_at: "${data.createdAt}"\n` +
            `updated_at: "${data.updatedAt}"\n` +
            `synced_at: "${data.syncedAt}"\n` +
            "---\n" +
            "\n" +
            `# ${data.title}\n` +
            "\n" +
            data.body;

        console.log(`Writing markdown for: ${data.title}`);

        const itemPath = path.join(config.outputDir, data.externalId + ".md");

        fs.writeFileSync(itemPath, markdown);
    }
}