import {AsyncEntry} from "@napi-rs/keyring";

const KEYRING_SERVICE = 'grove-ingest'
const KEYRING_ACCOUNT = 'composio-key'

function tokenEntry(): AsyncEntry {
    return new AsyncEntry(KEYRING_SERVICE, KEYRING_ACCOUNT);
}

export async function readCachedComposioKey(): Promise<string | null> {
    try {
        return await tokenEntry().getPassword() ?? null;
    } catch {
        return null;
    }
}

export async function writeCachedComposioKey(accessToken: string): Promise<void> {
    await tokenEntry().setPassword(accessToken);
}

export async function deleteCachedComposioKey(): Promise<void> {
    try {
        await tokenEntry().deleteCredential();
    } catch {
        // nothing cached to delete
    }
}
