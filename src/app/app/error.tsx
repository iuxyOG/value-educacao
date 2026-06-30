"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-3">Não foi possível carregar</h1>
            <p className="text-zinc-400 mb-8 max-w-sm">
                Ocorreu um erro ao carregar este conteúdo. Tente novamente em instantes.
            </p>
            <Button
                onClick={() => reset()}
                className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold"
            >
                Tentar novamente
            </Button>
        </div>
    )
}
