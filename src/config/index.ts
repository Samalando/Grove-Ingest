import setDefaultConfig from "./config";
import config from "./config";





export function loadConfig() {
    setDefaultConfig();
    if(config().providers.github.enabled && Bun.env.GITHUB_TOKEN !== null && config().providers.github.connector === "native") {
        config().githubToken = Bun.env.GITHUB_TOKEN;

    }
    console.log(config());
    console.log(Bun.env);
    const usesComposio = config().providers.github.connector === "composio" || config().providers.googleCalendar.connector === "composio";
    if (usesComposio && Bun.env.COMPOSIO_API_KEY === undefined) {
        throw new Error("Composio connector is set, but the token doesn't exist!")

    }
    return {

    }
}

