"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function CertificatePrintButton() {
    return (
        <Button
            onClick={() => window.print()}
            variant="outline"
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white h-10 font-semibold gap-2"
        >
            <Download size={16} />
            Salvar PDF
        </Button>
    )
}
