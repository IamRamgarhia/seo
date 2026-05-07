"use server";

import { configuredProviders, getActiveProvider } from "@/lib/api-keys";
import type { ActiveProvider } from "@/lib/api-keys";

export type ProviderListing = {
  configured: ActiveProvider[];
  active: ActiveProvider | null;
};

/**
 * Returns the providers the user has keys for, plus which one is currently
 * the workspace default. Safe to call from any client component — no key
 * material is ever exposed.
 */
export async function listConfiguredProviders(): Promise<ProviderListing> {
  const cfg = await configuredProviders();
  const active = await getActiveProvider();
  return { configured: cfg.ids as ActiveProvider[], active };
}
