/** Runs a server action from the browser without ever crashing the page. */
export async function callAction<T extends { ok: boolean; error?: string }>(f: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await f();
  } catch {
    return { ok: false, error: "Something went wrong on the server. Try again. If it keeps happening, check Admin → Settings → Integrations." };
  }
}
