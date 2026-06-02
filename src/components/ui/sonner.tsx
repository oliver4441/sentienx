"use client";

import { Toaster as Sonner } from "sonner";
import type { ComponentProps } from "react";

type ToasterProps = ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#16161d] group-[.toaster]:text-[#f4f4f5] group-[.toaster]:border-white/[0.06] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#a1a1aa]",
          actionButton:
            "group-[.toast]:bg-[#6366f1] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#0f0f14] group-[.toast]:text-[#a1a1aa]",
        },
      }}
      {...props}
    />
  );
}
