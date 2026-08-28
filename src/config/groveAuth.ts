import { readFile, writeFile, unlink } from "node:fs/promises";
import * as path from "node:path";

const COOKIE_FILE = path.join(process.cwd(), "grove-cookie.txt");
const GROVE_LOGIN_URL = "http://localhost:8123/~/login";

export async function readCachedGroveCookie(): Promise<string | null> {
    try {
        const cookie = (await readFile(COOKIE_FILE, "utf-8")).trim();
        return cookie || null;
    } catch {
        return null;
    }
}

export async function loginToGrove(password: string): Promise<string> {
    const res = await fetch(GROVE_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `password=${encodeURIComponent(password)}`,
    });
    if (!res.ok) {
        throw new Error(`Grove login failed: ${res.status}`);
    }

    const cookie = res.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) {
        throw new Error("Grove login succeeded but returned no cookie");
    }

    await writeFile(COOKIE_FILE, cookie, "utf-8");
    return cookie;
}

export async function deleteCachedGroveCookie(): Promise<void> {
    try {
        await unlink(COOKIE_FILE);
    } catch {
        // nothing cached to delete
    }
}
