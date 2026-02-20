"use client"

import { useState, useTransition } from "react"
import { createPost } from "@/app/actions/community"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Image as ImageIcon, Loader2 } from "lucide-react"

export function PostComposer({ userInitial }: { userInitial: string }) {
    const [content, setContent] = useState("")
    const [isPending, startTransition] = useTransition()

    const handleSubmit = () => {
        if (!content.trim() || isPending) return

        startTransition(async () => {
            const res = await createPost(content.trim())
            if (res.success) {
                setContent("")
            } else {
                alert("Erro ao publicar o post.")
            }
        })
    }

    return (
        <div className="border border-white/10 rounded-2xl bg-[#09090b] p-6 shadow-xl mb-8 flex gap-4">
            <div className="shrink-0 h-10 w-10 rounded-full bg-[#1a1a1c] flex items-center justify-center text-sm font-bold text-white border border-white/5">
                {userInitial}
            </div>

            <div className="flex-1 flex flex-col gap-3">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Compartilhe seus aprendizados com a comunidade..."
                    className="w-full bg-white/[0.02] border-white/5 text-zinc-300 placeholder:text-zinc-600 rounded-xl resize-none focus-visible:ring-[#ff6a1a] min-h-[100px]"
                />

                <div className="flex justify-between items-center pt-2">
                    <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-white/5 h-10 gap-2 px-3">
                        <ImageIcon size={18} />
                        <span className="hidden sm:inline">Anexar Imagem</span>
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isPending}
                        className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 h-10 px-6 font-bold shadow-lg shadow-[#ff6a1a]/20 gap-2"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                        Publicar
                    </Button>
                </div>
            </div>
        </div>
    )
}
