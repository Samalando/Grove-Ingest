import {Composio} from "@composio/core";


async function run() {
    const composio = new Composio({
        apiKey:
    });

    const session = await composio.create('user_123');

    const toolkits = await session.toolkits();
    const googlecalendar = toolkits.items.find(t => t.slug === 'googlecalendar');

    if (!googlecalendar?.connection?.isActive) {
        const auth = await session.authorize('googlecalendar');
        console.log(auth.redirectUrl);
        await auth.waitForConnection();
    }

    const result = await session.execute('GOOGLECALENDAR_EVENTS_LIST_ALL_CALENDARS', {
        time_min: "0001-01-01T00:00:00Z",
        time_max: "9999-12-31T23:59:59Z",
        response_detail: 'full'
    });

    console.log(result.data);

}

run();