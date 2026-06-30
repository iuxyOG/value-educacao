"use client"

import type { ComponentProps } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = ComponentProps<typeof Sonner>

export function Toaster(props: ToasterProps) {
    return (
        <Sonner
            theme="dark"
            position="top-right"
            toastOptions={{
                classNames: {
                    toast: "bg-[#0d0d0f] border border-white/10 text-zinc-200 shadow-xl",
                    description: "text-zinc-400",
                    actionButton: "bg-[#ff6a1a] text-white",
                    cancelButton: "bg-white/10 text-zinc-300",
                    error: "text-red-400",
                    success: "text-[#ff6a1a]",
                },
            }}
            {...props}
        />
    )
}
