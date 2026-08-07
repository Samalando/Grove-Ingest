import {Composio} from "@composio/core";

import {Config} from "../../config/config";
import {AuthNotice} from "../authNotice";

export async function gmailRun(config: Config, onAuthNotice?: (notice: AuthNotice | null) => void) {
    if (config === undefined || config.google?.type === undefined) {
        throw new Error("config is undefined");
    }
    let me
    if (config.google?.type === "gmail") {
        me = config.google.gmail;
    }

    if (config.spike.type === "composio") {
        const composio = new Composio({
            apiKey: config.spike.composioApiKey,
        });

        const session = await composio.create(config.spike.username);

        const toolkits = await session.toolkits();
        const gmail = toolkits.items.find(t => t.slug === 'gmail');

        if (!gmail?.connection?.isActive) {
            const auth = await session.authorize('gmail');
            console.log(auth.redirectUrl);
            if (auth.redirectUrl) onAuthNotice?.({ url: auth.redirectUrl });
            await auth.waitForConnection();
            onAuthNotice?.(null);
        }

        const result = await session.execute('GMAIL_FETCH_EMAILS', {
            max_results: 10, /* want to not hardcode this eventually.*/
            include_payloads: true
        });

        return result.data;
    }
}