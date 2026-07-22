import {Composio} from "@composio/core";
import {Config} from "../../config/config";


export async function composio() {
    const composio = new Composio({
        apiKey: 
    });

    const session = await composio.create('user_123');

    const toolkits = await session.toolkits();
    const github = toolkits.items.find(t => t.slug === 'github');

    if (!github?.connection?.isActive) {
        const auth = await session.authorize('github');
        console.log(auth.redirectUrl);
        await auth.waitForConnection();
    }

    const result = await session.execute('GITHUB_LIST_REPOSITORY_ISSUES', {
        owner: 'Samalando',
        repo: 'Grove-Ingest',
        state: 'all'
    });

    console.log(result.data.issues);

}

composio();