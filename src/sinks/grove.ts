import {Config} from "../config/config";
import {AuthNotice} from "../connectors/authNotice";
import {renderMarkdownFiles} from "../renderer/renderMarkdown";

export async function toGroveMarkdown(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const files = await renderMarkdownFiles(config, onAuthNotice, { plainMarkdown: true });

    const errors: string[] = [];
    for (const file of files) {
        try {
            const res = await fetch(`http://localhost:8123/grove/ingest/${file.kind}/${encodeURIComponent(file.filename)}`, {
                method: "PUT",
                headers: {
                    "Accept": "application/json",
                    "Cookie": config.sinks.grove.cookie ?? "",
                },
                body: file.content,
            });

            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}`);
            }
        } catch (e) {
            errors.push(`${file.filename}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Grove write failed for ${errors.length}/${files.length} file(s):\n${errors.join("\n")}`);
    }

    return files.length;
}