import {composio} from "../../connectors/github/composio";
import { MarkdownConfig } from "../markdown";


export async function run(): Promise<MarkdownConfig> {
    const IngestedData = await composio()
        IngestedData


    return {
        provider: "github",
        externalId: IngestedData.id,
        sourceUrl: IngestedData.html_url,
        title: IngestedData.title,
        body: IngestedData.body,
        createdAt: IngestedData.created_at,
        updatedAt: IngestedData.updated_at,
        syncedAt: Date().toLocaleString(),
        kind: "github-pr"
    }


}

run()