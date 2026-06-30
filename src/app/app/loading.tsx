import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff6a1a]" />
            <span className="sr-only">Carregando…</span>
        </div>
    )
}
