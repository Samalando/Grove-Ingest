
import * as p from "@clack/prompts";
import {GithubExportMode, SpikeConfig} from "../config/config";
import {setConfig} from "../config";

console.log("Its running")


//console.log(loadConfig());

export async function start() {
    const dataImport = await p.select({
        message: "What do you want to sync?",
        options: [
            { value: "github", label: "GitHub" },
            { value: "google", label: "Google Suite" },
        ],
    });
    if (p.isCancel(dataImport)) process.exit(1);

    let googleMode: "gmail" | "calendar" | symbol | undefined;
    if (dataImport === "google") {
        googleMode = await p.select<"gmail" | "calendar">({
             message: "Please select your Google Suite type",
            options: [
        {value: "gmail", label: "Gmail"},
                {value: "calendar", label: "Google Calendar"}
            ]
        })
    }
    if (p.isCancel(googleMode)) process.exit(1);

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
    if (googleMode === "calendar") {
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

    let select
    if(dataQuantity === "select") {
         select = await p.text({
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
        message: "please put your Composio key below.",
        mask: '*'
    })
        composioUser = await p.text({
            message: "please put your Composio Username. It must match your GitHub username."
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
           config = setConfig(targetDir, spike, undefined, { mode: githubMode }, select, googleMode, start, end)

        }
    }

    if(dataImport === "google"){
        config = setConfig(targetDir, spike, undefined, undefined, undefined, googleMode , start, end)
    }
    //console.log(config);
    if (!config) {
        throw new Error("config is undefined");
    }
    return config;

}

