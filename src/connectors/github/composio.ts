import {Composio} from "@composio/core";

import {Config} from "../../config/config";
import {AuthNotice} from "../authNotice";


export async function composio(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {


    if(config === undefined || config.github === undefined) {
        throw new Error("config is undefined");
    }
    if(config.spike.type === "composio") {
        const composio = new Composio({
            apiKey: config.spike.composioApiKey,
        });

        const session = await composio.create(config.spike.username);

        const toolkits = await session.toolkits();
        const github = toolkits.items.find(t => t.slug === 'github');

        if (!github?.connection?.isActive) {
            const auth = await session.authorize('github');
            console.log(auth.redirectUrl);
            if (auth.redirectUrl) onAuthNotice?.({ url: auth.redirectUrl });
            await auth.waitForConnection();
            onAuthNotice?.(null);
        }
        let result;
        if(config.github.mode === "issues") {
             result = await session.execute('GITHUB_LIST_REPOSITORY_ISSUES', {
                repo: "grove-ingest",
                owner: config.spike.username,
            });
             // @ts-ignore
            result = result.data.issues.filter(item => !item.pull_request)
            console.log(result);
        } else if (config.github.mode === "prs") {
            result = await session.execute('GITHUB_LIST_PULL_REQUESTS', {
                repo: "grove-ingest",
                owner: config.spike.username,
            });
            result = result.data.pull_requests
        } /*else if (config.github.mode === "issues") {
            result = await session.execute('GITHUB_LIST_ISSUES_ASSIGNED_TO_THE_AUTHENTICATED_USER', {
                
            })
        }*/
        console.log(JSON.stringify(result, null, 2));
        return result;
    }
    else return;

}