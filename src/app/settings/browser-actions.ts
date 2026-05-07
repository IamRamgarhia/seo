"use server";

import { revalidatePath } from "next/cache";
import { getSetting, setSetting } from "@/lib/settings-store";
import { closeBrowser } from "@/lib/browser-pool";

export type BrowserSettingsState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function saveBrowserSettings(
  _prev: BrowserSettingsState | null,
  formData: FormData,
): Promise<BrowserSettingsState> {
  const concRaw = formData.get("maxConcurrency");
  const conc = concRaw ? Number(concRaw) : 4;
  if (!Number.isFinite(conc) || conc < 1 || conc > 16) {
    return {
      ok: false,
      error: "Concurrency must be between 1 and 16.",
    };
  }
  const proxiesRaw = String(formData.get("proxies") ?? "")
    .trim()
    .replace(/\r/g, "");
  const stealth = formData.get("stealth") === "on";

  await setSetting("browser.max_concurrency", conc);
  await setSetting("browser.proxies", proxiesRaw);
  await setSetting("browser.stealth_enabled", stealth);

  // Force-close the browser so the next launch picks up new settings.
  await closeBrowser();

  revalidatePath("/settings");
  return { ok: true, message: "Saved. Browser will relaunch on next use." };
}

export async function loadBrowserSettings() {
  return {
    maxConcurrency:
      (await getSetting<number>("browser.max_concurrency")) ?? 4,
    proxies: (await getSetting<string>("browser.proxies")) ?? "",
    stealth: ((await getSetting<boolean>("browser.stealth_enabled")) ?? true),
  };
}
