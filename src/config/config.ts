export type Config = {
    github?: { mode: GithubExportMode; repo?: string }
    spike: SpikeConfig
    sinks: { grove: { enabled: boolean } }
    outputDir: string;
    google?: GoogleExportMode;

}

export type GithubExportMode = "prs" | "issues";
export type GoogleExportMode = { type: "calendar"; calendar?: { start: Date; end: Date } } | { type: "gmail"; gmail?: {sendDate: Date; sendTime: Date; cc: string} };

export type SpikeConfig =
    | { type: "composio"; composioApiKey: string; username: string }
    | { type: "native" };