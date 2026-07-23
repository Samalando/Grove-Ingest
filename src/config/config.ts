

export type Config = {
    github?: { mode: GithubExportMode; token: string }
    spike: SpikeConfig
    sinks: { grove: { enabled: boolean } }
    outputDir: string;
}

export type GithubExportMode = "prs" | "issues";

export type SpikeConfig =
    | { type: "composio"; composioApiKey: string; username: string }
    | { type: "native" };