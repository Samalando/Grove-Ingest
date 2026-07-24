import {start} from "./cli";
import {toMarkdown} from "./sinks/local";

async function stuff() {
    const config = await start()

    if (config === undefined || config.github === undefined) {
        throw new Error("config is undefined");
    } else {

      await toMarkdown(config);
    }

}
stuff().catch(console.error);