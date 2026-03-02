"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

type DataValueProps = {
  value: string;
  copyText?: string;
  monospace?: boolean;
} & Omit<React.ComponentProps<"span">, "children">;

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function DataValue({
  value,
  copyText,
  monospace,
  className,
  ...props
}: DataValueProps) {
  const [copied, setCopied] = React.useState(false);
  const copyable = typeof copyText === "string" && copyText.length > 0;

  async function onCopy() {
    if (!copyable) return;
    try {
      await copyToClipboard(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // Ignore copy errors (restricted environments)
    }
  }

  return (
    <span
      {...props}
      role={copyable ? "button" : undefined}
      tabIndex={copyable ? 0 : undefined}
      onClick={copyable ? onCopy : props.onClick}
      onKeyDown={
        copyable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void onCopy();
              }
            }
          : props.onKeyDown
      }
      title={copyable ? "Click to copy" : undefined}
      className={cn(
        "group inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 align-middle transition-colors",
        copyable &&
          "-mx-1.5 cursor-copy hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        monospace && "font-mono tabular-nums",
        className
      )}
    >
      <span className="truncate">{value}</span>
      {copyable ? (
        <span className="ml-0.5 inline-flex items-center opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </span>
      ) : null}
    </span>
  );
}

export { DataValue };
