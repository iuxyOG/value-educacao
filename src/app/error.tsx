"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <p className="text-5xl font-black text-[#ff6a1a] mb-4">Ops!</p>
            <h1 className="text-2xl font-bold mb-3">Algo deu errado</h1>
            <p className="text-zinc-400 mb-8 max-w-sm">
                Tivemos um problema ao carregar esta página. Você pode tentar novamente.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                    onClick={() => reset()}
                    className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold"
                >
                    Tentar novamente
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
                >
                    <Link href="/app">Ir para o início</Link>
                </Button>
            </div>
        </div>
    )
}
