import { nativeGithub } from "../../connectors/github/native";
import { MarkdownConfig } from "../markdown";
import { Config } from "../../config/config";

export async function nativeRun(config: Config): Promise<MarkdownConfig[]> {
    const now: Date = new Date();
    const isoString: string = now.toISOString();

    const ingestedData = await nativeGithub(config);

    return ingestedData.map((data: any) => {
        return {
            provider: "github",
            externalId: data.id.toString(),
            sourceUrl: data.html_url,
            title: data.title,
            body: data.body,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            syncedAt: isoString,
            issueNumber: data.number,
            kind: config.github?.mode === "issues" ? "github-issue" : "github-pr",
        };
    });
}
