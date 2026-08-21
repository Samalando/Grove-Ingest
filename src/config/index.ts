import { Config, SpikeConfig, GithubExportMode} from "./config";



export function setConfig(output: string,  spike: SpikeConfig, sinkState?: boolean, github?: { mode: GithubExportMode }, repo?: string, googleType?: "gmail" | "calendar", start?: Date, end?: Date, categories?: string[], maxResults?: number, grovecookie?: string): Config {
    return{
        github: github?.mode ? {mode: github?.mode, repo: repo ?? ""} : undefined,
        spike: spike,
        sinks: { grove: { enabled: sinkState ?? false, cookie: grovecookie } },
        outputDir: output,
        google: googleType === "calendar"
            ? { type: "calendar", calendar: { start: start ?? new Date(), end: end ?? new Date()} }
            : googleType === "gmail"
            ? { type: "gmail", gmail:{
                categories: categories ?? undefined,
                maxResults: maxResults ?? undefined,
                start,
                end,
                    }}
            : undefined
    }
}


