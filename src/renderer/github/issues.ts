import { composio } from "../../connectors/github/composio";
import { MarkdownConfig } from "../markdown";
import { Config } from "../../config/config";
import { AuthNotice } from "../../connectors/authNotice";

export async function issuesRun(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void): Promise<MarkdownConfig[]> {
    const now: Date = new Date();
    const isoString: string = now.toISOString();

    const ingestedData = await composio(config, onAuthNotice);

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
            repo: config.github,
            kind: "github-issue"
        };
    });
}