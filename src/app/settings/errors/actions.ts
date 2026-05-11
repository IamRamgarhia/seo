"use server";

import { revalidatePath } from "next/cache";
import { clearAllResolved, markErrorResolved } from "@/lib/error-log";

export async function resolveErrorAction(id: number): Promise<void> {
  await markErrorResolved(id);
  revalidatePath("/settings/errors");
}

export async function clearResolvedAction(): Promise<void> {
  await clearAllResolved();
  revalidatePath("/settings/errors");
}
