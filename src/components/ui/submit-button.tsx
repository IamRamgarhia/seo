"use client";

/**
 * Drop-in replacement for <Button type="submit"> inside a <form action={...}>.
 * Uses React 19's useFormStatus to flip into a "loading" state automatically
 * while the server action is in flight — no manual useState plumbing needed
 * in the parent.
 *
 * Without this, users click Run audit / Refresh / Save and see nothing
 * happen for 5-30 seconds (the request is running, but the UI looks
 * frozen). This swaps the icon for a spinner + disables the button +
 * fires a sonner toast so feedback is immediate.
 */

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "destructive" | "secondary";

type Props = {
  /** Label shown when idle */
  children: React.ReactNode;
  /** Label shown while the action is running. Default: same as children + " …" */
  pendingChildren?: React.ReactNode;
  /** Optional icon shown when idle */
  icon?: LucideIcon;
  /** Optional toast title fired the moment the action starts */
  pendingToast?: string;
  /** Toast description */
  pendingToastDescription?: string;
  variant?: Variant;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  title?: string;
};

export function SubmitButton({
  children,
  pendingChildren,
  icon: Icon,
  pendingToast,
  pendingToastDescription,
  variant,
  size,
  className,
  title,
}: Props) {
  const { pending } = useFormStatus();

  // Fire a toast the moment pending flips true — so the user gets
  // immediate confirmation even before any UI repaint.
  useEffect(() => {
    if (pending && pendingToast) {
      toast.loading(pendingToast, {
        description: pendingToastDescription,
        id: `submit-${pendingToast}`,
      });
    }
    if (!pending && pendingToast) {
      // Dismiss the loading toast — success/failure toasts come from the
      // server action's revalidation, or the caller can fire one manually.
      toast.dismiss(`submit-${pendingToast}`);
    }
  }, [pending, pendingToast, pendingToastDescription]);

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      title={title}
      className={cn(pending && "cursor-wait", className)}
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          {pendingChildren ?? <>{children}…</>}
        </>
      ) : (
        <>
          {Icon && <Icon className="size-3.5" />}
          {children}
        </>
      )}
    </Button>
  );
}
