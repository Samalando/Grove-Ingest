
import * as p from "@clack/prompts";
import { GithubExportMode, SpikeConfig} from "../config/config";
import {setConfig} from "../config";

console.log("Its running")


//console.log(loadConfig());

export async function start() {
    const dataImport = await p.select({
        message: "What do you want to sync?",
        options: [
            { value: "github", label: "GitHub" },
            { value: "calendar", label: "Google Calendar" },
            //{ value: "gmail", label: "Gmail" },
        ],
    });
    if (p.isCancel(dataImport)) process.exit(1);

    let githubMode: GithubExportMode | symbol | undefined;
    if (dataImport === "github") {
        githubMode = await p.select<GithubExportMode>({
            message: "What from GitHub?",
            options: [
                { value: "prs", label: "Pull Requests" },
                { value: "issues", label: "Issues" }
            ],
        })
    }
    if (p.isCancel(githubMode)) process.exit(1);

    let start;
    let end;
    if (dataImport === "calendar") {
         start = await p.date(({
            message: 'Start Date of calendar ingest',
            minDate: new Date('1900-01-01'),
            initialValue: new Date(),
            maxDate: new Date(),
        }))
        if (p.isCancel(start)) process.exit(1);

        end = await p.date(({
            message: 'End Date of calendar ingest',
            minDate: new Date('1900-01-01'),
            initialValue: new Date(),
            maxDate: new Date('3000-01-01'),
        }))
        if (p.isCancel(end)) process.exit(1);
    }

    const dataQuantity = await p.select({
        message: "Do you want to import one bit or all the data?",
        options: [
            { value: "all", label: "All Data" },
            { value: "select", label: "Select data" }
        ]
    })
    if (p.isCancel(dataQuantity)) process.exit(1);

    if(dataQuantity === "select") {
        const select = await p.text({
            message: "Please send what data you want to import"
        })
        if (p.isCancel(select)) process.exit(1);
    }

    const spikeType = await p.select<"composio" | "native">({
        message: "which do you want to use as your spike?",
        options: [
            { value: "composio", label: "Composio", hint: "Recommended!" },
            { value: "native", label: "Native" },
        ]

    })
    if (p.isCancel(spikeType)) process.exit(1);

    let composioKey: string | symbol | undefined;
    let composioUser: string | symbol | undefined;
    if (spikeType === "composio") {
     composioKey = await p.password({
        message: "please put your composio key below.",
        mask: '*'
    })
        composioUser = await p.text({
            message: "please put youe composio Username. It must match your GitHub username."
        })
    }
    if (p.isCancel(composioKey)) process.exit(1);
    if (p.isCancel(composioUser)) process.exit(1);

    
    const targetDir = await p.path({
        message: 'Select the output directory.',
        directory: true,
    });
    if (p.isCancel(targetDir)) process.exit(1);

    const spike: SpikeConfig = spikeType === "composio"
        ? { type: "composio", composioApiKey: composioKey ?? "", username: composioUser ?? ""}
        : { type: "native" };
let config;
    if(dataImport === "github") {
        if (githubMode !== undefined) {
           config = setConfig(targetDir, spike, undefined, undefined, { mode: githubMode })

        }
    }
    console.log(config);
    if (!config) {
        throw new Error("config is undefined");
    }
    return config;

}

