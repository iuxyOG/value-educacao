import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <p className="text-6xl font-black text-[#ff6a1a] mb-4">404</p>
            <h1 className="text-2xl font-bold mb-3">Página não encontrada</h1>
            <p className="text-zinc-400 mb-8 max-w-sm">
                O conteúdo que você procura não existe ou foi movido.
            </p>
            <Button asChild className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold">
                <Link href="/app">Voltar para o início</Link>
            </Button>
        </div>
    )
}
