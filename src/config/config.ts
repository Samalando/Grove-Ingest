export type Config = {
    github?: { mode: GithubExportMode; repo?: string }
    spike: SpikeConfig
    sinks: { grove: { enabled: boolean; cookie?: string } }
    outputDir: string;
    google?: GoogleExportMode;

}

export type GithubExportMode = "prs" | "issues";
export type GoogleExportMode = { type: "calendar"; calendar?: { start: Date; end: Date } } | { type: "gmail"; gmail?: {categories?: string[]; maxResults?: number; start?: Date; end?: Date} };

export type SpikeConfig =
    | { type: "composio"; composioApiKey: string; username: string }
    | { type: "native" };