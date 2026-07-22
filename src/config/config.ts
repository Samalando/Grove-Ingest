

export type Config = {
    github?: { mode: GithubExportMode; token: string }
    spike: SpikeConfig
    sinks: { grove: { enabled: boolean } }
    outputDir: string;
}

export type GithubExportMode = "prs" | "issues" | "both";

export type SpikeConfig =
    | { type: "composio"; composioApiKey: string }
    | { type: "native" };