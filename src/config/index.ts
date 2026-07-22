import { Config, SpikeConfig, GithubExportMode} from "./config";



export function setConfig(output: string,  spike: SpikeConfig, sinkState?: boolean, githubTokenId?: string, github?: { mode: GithubExportMode }): Config {
    return{
        github: github?.mode ? {mode: github?.mode, token: githubTokenId ?? ""} : undefined,
        spike: spike,
        sinks: { grove: { enabled: sinkState ?? false } },
        outputDir: output
    }
}


