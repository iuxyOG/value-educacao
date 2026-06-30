"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function DeleteConfirm({
    trigger,
    title,
    description,
    confirmLabel = "Excluir",
    successMessage,
    action,
}: {
    trigger: React.ReactNode
    title: string
    description: string
    confirmLabel?: string
    successMessage?: string
    action: () => Promise<{ success: boolean; error?: string }>
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleConfirm = () => {
        startTransition(async () => {
            const res = await action()
            if (res.success) {
                toast.success(successMessage ?? "Removido")
                setOpen(false)
            } else {
                toast.error(res.error ?? "Falha ao remover")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={isPending} className="bg-red-500/90 text-white hover:bg-red-500 gap-2">
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
