

export type Config = {
    github?: { mode: GithubExportMode; token: string; repo?: string }
    spike: SpikeConfig
    sinks: { grove: { enabled: boolean } }
    outputDir: string;
    google?: GoogleExportMode;

}

export type GithubExportMode = "prs" | "issues";

export type GoogleExportMode = { type: "calendar"; calendar?: { start: Date; end: Date }}| {type: "gmail" };

export type SpikeConfig =
    | { type: "composio"; composioApiKey: string; username: string }
    | { type: "native" };