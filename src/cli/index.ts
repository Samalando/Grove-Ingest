
import * as p from "@clack/prompts";
import {GithubExportMode, SpikeConfig} from "../config/config";
import {setConfig} from "../config";
import {listRepositories} from "../connectors/github/composio";
import {deleteCachedGithubToken} from "../connectors/github/native";
import {readCachedComposioKey, writeCachedComposioKey, deleteCachedComposioKey} from "../config/composioKeyring";
import {readCachedGroveCookie, loginToGrove, deleteCachedGroveCookie} from "../config/groveAuth";

console.log("Its running")

//console.log(loadConfig());

export async function start() {
    const action = await p.select({
        message: "What would you like to do?",
        options: [
            { value: "sync", label: "Sync data" },
            { value: "reset", label: "Reset saved credentials" },
        ],
    });
    if (p.isCancel(action)) process.exit(1);

    if (action === "reset") {
        const which = await p.multiselect({
            message: "Which saved credentials do you want to forget?",
            options: [
                { value: "composio", label: "Composio API key" },
                { value: "github-native", label: "GitHub native login" },
                { value: "grove", label: "Grove account cookie" },
            ],
        });
        if (p.isCancel(which)) process.exit(1);

        if (which.includes("composio")) await deleteCachedComposioKey();
        if (which.includes("github-native")) await deleteCachedGithubToken();
        if (which.includes("grove")) await deleteCachedGroveCookie();

        p.outro("Saved credentials cleared.");
        process.exit(0);
    }

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

    let maxResults: number | undefined;
    if (googleMode === "gmail") {
        const maxResultsText = await p.text({
            message: "Max number of emails to fetch",
            placeholder: "30",
            initialValue: "30",
            validate: (value) => {
                const n = Number(value);
                if (!value || Number.isNaN(n) || n <= 0) return "Enter a positive number";
            },
        });
        if (p.isCancel(maxResultsText)) process.exit(1);
        maxResults = Number(maxResultsText);

        const wantsDateRange = await p.confirm({
            message: "Filter emails by date range?",
            initialValue: false,
        });
        if (p.isCancel(wantsDateRange)) process.exit(1);

        if (wantsDateRange) {
            start = await p.date(({
                message: 'Start Date of email ingest',
                minDate: new Date('1900-01-01'),
                initialValue: new Date(),
                maxDate: new Date(),
            }))
            if (p.isCancel(start)) process.exit(1);

            end = await p.date(({
                message: 'End Date of email ingest',
                minDate: new Date('1900-01-01'),
                initialValue: new Date(),
                maxDate: new Date('3000-01-01'),
            }))
            if (p.isCancel(end)) process.exit(1);
        }
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
    const cachedToken = await readCachedComposioKey();

    if (spikeType === "composio") {
        if (cachedToken) {
            composioKey = cachedToken;
        } else {
            composioKey = await p.password({
                message: "please put your Composio key below.",
                mask: '*'
            })
            if (p.isCancel(composioKey)) process.exit(1);
            await writeCachedComposioKey(composioKey);
        }

        composioUser = await p.text({
            message: "please put your Composio Username."
        })
    }
    if (p.isCancel(composioKey)) process.exit(1);
    if (p.isCancel(composioUser)) process.exit(1);

    const dataQuantity = await p.select({
        message: "Do you want to import one bit or all the data?",
        options: [
            { value: "all", label: "All Data" },
            { value: "select", label: "Select data" }
        ]
    })
    if (p.isCancel(dataQuantity)) process.exit(1);

    let select
    let categories: string[] | symbol = []
    if(dataQuantity === "select") {
        if (dataImport === "github" && spikeType === "composio") {
            const spinner = p.spinner();
            spinner.start("Fetching your repositories");
            const repos = await listRepositories(
                { type: "composio", composioApiKey: composioKey ?? "", username: composioUser ?? "" },
                (notice) => { if (notice) spinner.message(`Authorize Composio: ${notice.url}`) },
            );
            spinner.stop("Repositories loaded");

            select = await p.select({
                message: "Which repository?",
                options: repos.map((name) => ({ value: name, label: name })),
            })
        }

        if (p.isCancel(select)) process.exit(1);

        if(googleMode === "gmail") {
            categories = await p.groupMultiselect({
                message: 'Select additional tools.',
                options: {
                    Labels: [
                        { value: 'INBOX', label: 'Inbox' },
                        { value: 'SPAM', label: 'Spam' },
                        { value: 'TRASH', label: 'Trash' },
                        { value: 'UNREAD', label: 'Unread' },
                        { value: 'STARRED', label: 'Starred' },
                        { value: 'IMPORTANT', label: 'Important' },
                        { value: 'CATEGORY_PRIMARY', label: 'Primary' },
                        { value: 'CATEGORY_SOCIAL', label: 'Social' },
                        { value: 'CATEGORY_PROMOTIONS', label: 'Promotions' },
                        { value: 'CATEGORY_UPDATES', label: 'Updates' },
                        { value: 'CATEGORY_FORUMS', label: 'Forums' },
                    ],
                },
            })
            if (p.isCancel(categories)) process.exit(1);
        }
    }

    const sink = await p.select({
        message: "Would you like to save these files locally or to Grove?",
        options: [
            { value: "local", label: "Locally" },
            { value: "grove", label: "Grove" },
        ]
    })
    if (p.isCancel(categories)) process.exit(1);

    let pass
    let targetDir
    let groveCookie
    if(sink == "local"){
        targetDir = await p.path({
            message: 'Select the output directory.',
            directory: true,
        });
        if (p.isCancel(targetDir)) process.exit(1);
    }else if(sink == "grove"){
        const cachedCookie = await readCachedGroveCookie();
        if (cachedCookie) {
            groveCookie = cachedCookie;
        } else {
            pass = await p.password({
                message: "please put your account password below.",
                mask: '*'
            })
            if (p.isCancel(pass)) process.exit(1);

            groveCookie = await loginToGrove(String(pass));
        }
    }



    const spike: SpikeConfig = spikeType === "composio"
        ? { type: "composio", composioApiKey: composioKey ?? "", username: composioUser ?? ""}
        : { type: "native" };
let config;

if(targetDir) {
    if(dataImport === "github") {
        if (githubMode !== undefined) {
            config = setConfig(targetDir, spike, undefined, { mode: githubMode }, select, googleMode, start, end)

        }
    }

    if(dataImport === "google"){
        config = setConfig(targetDir, spike, undefined, undefined, undefined, googleMode , start, end, categories, maxResults)
    }
}

if(sink === "grove"){
    if(dataImport === "github") {
        if (githubMode !== undefined) {
            config = setConfig("", spike, true, { mode: githubMode }, select, googleMode, start, end, undefined, undefined, groveCookie)

        }
    }

    if(dataImport === "google"){
        config = setConfig("", spike, true, undefined, undefined, googleMode , start, end, categories, maxResults, groveCookie)
    }
}


    //console.log(config);
    if (!config) {
        throw new Error("config is undefined");
    }
    return config;

}

