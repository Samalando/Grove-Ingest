import {deleteCachedComposioKey} from "../config/composioKeyring";

export function isInvalidCredentialError(error: unknown): boolean {
    let current: any = error;
    for (let i = 0; i < 5 && current; i++) {
        if (current.status === 401 || current.statusCode === 401) return true;
        current = current.cause;
    }
    return false;
}

export async function invalidateComposioKeyIfStale(error: unknown): Promise<void> {
    if (isInvalidCredentialError(error)) {
        await deleteCachedComposioKey();
    }
}
