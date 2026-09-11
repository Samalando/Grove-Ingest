import {start} from "./cli";
import {toLocalMarkdown} from "./sinks/local";
import {toGroveMarkdown} from "./sinks/grove";


async function stuff() {
    const config = await start()

    if (config === undefined) {
        throw new Error("config is undefined");
    }
        if(!config.sinks.grove.enabled) {
            await toLocalMarkdown(config, (notice) => {
                if (notice) console.log(`Authorize: ${notice.url}${notice.code ? ` (code: ${notice.code})` : ""}`);
            });
        }
        if (config.sinks.grove.enabled) {
            await toGroveMarkdown(config, (notice) => {
                if (notice) console.log(`Authorize: ${notice.url}`);
            })
        }

}
stuff().catch(console.error);