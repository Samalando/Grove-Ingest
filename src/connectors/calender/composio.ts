import {Composio} from "@composio/core";

import {Config} from "../../config/config";

async function run(config: Config) {
    if(config === undefined || config.github === undefined) {
        throw new Error("config is undefined");
    }
    if(config.spike.type === "composio") {
        const composio = new Composio({
            apiKey: config.spike.composioApiKey,
        });

        const session = await composio.create(config.spike.username);

    const toolkits = await session.toolkits();
    const googlecalendar = toolkits.items.find(t => t.slug === 'googlecalendar');

    if (!googlecalendar?.connection?.isActive) {
        const auth = await session.authorize('googlecalendar');
        console.log(auth.redirectUrl);
        await auth.waitForConnection();
    }

    const result = await session.execute('GOOGLECALENDAR_EVENTS_LIST_ALL_CALENDARS', {
        time_min: ,
        time_max: "9999-12-31T23:59:59Z",
        response_detail: 'full'
    });

    console.log(result.data);

}

run();