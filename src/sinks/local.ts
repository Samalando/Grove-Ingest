import * as fs from 'fs';
import {Config} from "../config/config";
import * as path from "node:path";
import {AuthNotice} from "../connectors/authNotice";
import {renderMarkdownFiles} from "../renderer/renderMarkdown";

const UPDATED_AT_REG = /^updated_at: "(.*)"$/m;

export async function toLocalMarkdown(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const files = await renderMarkdownFiles(config, onAuthNotice);

    let written = 0;
    const errors: string[] = [];
    for (const file of files) {
        try {
            const fullPath = path.join(config.outputDir, file.filename);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });

            if (fs.existsSync(fullPath)) {
                const existingUpdatedAt = fs.readFileSync(fullPath, 'utf8').match(UPDATED_AT_REG)?.[1];
                const newUpdatedAt = file.content.match(UPDATED_AT_REG)?.[1];
                if (existingUpdatedAt !== undefined && existingUpdatedAt === newUpdatedAt) {
                    continue;
                }
            }

            fs.writeFileSync(fullPath, file.content);
            written++;
        } catch (e) {
            errors.push(`${file.filename}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Local write failed for ${errors.length}/${files.length} file(s):\n${errors.join("\n")}`);
    }

    return written;
}