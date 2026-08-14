import {start} from "./cli";
import {toMarkdown} from "./sinks/local";

async function stuff() {
    const config = await start()

    if (config === undefined) {
        throw new Error("config is undefined");
    } else {

      await toMarkdown(config, (notice) => {
          if (notice) console.log(`Authorize: ${notice.url}${notice.code ? ` (code: ${notice.code})` : ""}`);
      });
    }

}
stuff().catch(console.error);