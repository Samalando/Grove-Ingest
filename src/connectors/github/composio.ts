import {Composio} from "@composio/core";

import {Config, SpikeConfig} from "../../config/config";
import {AuthNotice} from "../authNotice";
import {invalidateComposioKeyIfStale} from "../authError";

type ComposioSpike = Extract<SpikeConfig, { type: "composio" }>;

async function connectGithub(spike: ComposioSpike, onAuthNotice?: (notice: AuthNotice | null) => void) {
    try {
        const composio = new Composio({
            apiKey: spike.composioApiKey,
        });

        const session = await composio.create(spike.username);

        const toolkits = await session.toolkits();
        const github = toolkits.items.find(t => t.slug === 'github');

        if (!github?.connection?.isActive) {
            const auth = await session.authorize('github');
            console.log(auth.redirectUrl);
            if (auth.redirectUrl) onAuthNotice?.({ url: auth.redirectUrl });
            await auth.waitForConnection();
            onAuthNotice?.(null);
        }

        return session;
    } catch (error) {
        await invalidateComposioKeyIfStale(error);
        throw error;
    }
}

export async function listRepositories(spike: ComposioSpike, onAuthNotice?: (notice: AuthNotice | null) => void) {
    const session = await connectGithub(spike, onAuthNotice);
    const userResponse = await session.execute('GITHUB_GET_THE_AUTHENTICATED_USER');
    const login = userResponse.data.login;

    const result = await session.execute('GITHUB_LIST_REPOSITORIES_FOR_A_USER', { username: login });
    // @ts-ignore - response shape isn't typed by the Composio SDK
    const repos = result.data.repositories as Array<{ name: string }>;
    return repos.map(r => r.name);
}

export async function composio(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {

    if(config === undefined || config.github === undefined) {
        throw new Error("config is undefined");
    }
    if(config.spike.type !== "composio") return;



    const session = await connectGithub(config.spike, onAuthNotice);
    const userResponse = await session.execute('GITHUB_GET_THE_AUTHENTICATED_USER');
    const login = userResponse.data.login;

    let result;
    if(config.github.mode === "issues" && config.github.repo) {
        result = await session.execute('GITHUB_LIST_REPOSITORY_ISSUES', {
            repo: config.github.repo,
            owner: login
        });
        // @ts-ignore
        result = result.data.issues.filter(item => !item.pull_request)
    } else if (config.github.mode === "prs" && config.github.repo) {
        result = await session.execute('GITHUB_LIST_PULL_REQUESTS', {
            repo: config.github.repo,
            owner: login
        });
        result = result.data.pull_requests
    } else if (config.github.mode === "issues") {
        result = await session.execute('GITHUB_LIST_ISSUES_ASSIGNED_TO_THE_AUTHENTICATED_USER')
        //@ts-ignore
        result = result.data.issues.filter(item => !item.pull_request)
    } else if (config.github.mode === "prs") {

        result = await session.execute('GITHUB_LIST_ISSUES_ASSIGNED_TO_THE_AUTHENTICATED_USER', {
            filter: "created"
        })
        console.log(JSON.stringify(result, null, 2));
        //@ts-ignore
        result = result.data.issues.filter(item => !!item.pull_request);
    }

    return result;
}