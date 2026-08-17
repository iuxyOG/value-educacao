"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createLesson, updateLesson } from "@/app/admin/actions"
import { extractVideoInfo, storedIdToInfo } from "@/lib/youtube"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type LessonData = {
    id: string
    title: string
    description: string | null
    youtubeVideoId: string
}

export function LessonDialog({
    mode,
    moduleId,
    lesson,
    trigger,
}: {
    mode: "create" | "edit"
    moduleId?: string
    lesson?: LessonData
    trigger: React.ReactNode
}) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState(lesson?.title ?? "")
    const [description, setDescription] = useState(lesson?.description ?? "")
    const [videoUrl, setVideoUrl] = useState(() => {
        if (!lesson) return ""
        const info = storedIdToInfo(lesson.youtubeVideoId)
        if (info?.type === "drive") return `https://drive.google.com/file/d/${info.id}/view`
        return `https://youtu.be/${lesson.youtubeVideoId}`
    })

    const videoInfo = extractVideoInfo(videoUrl)

    const handleSubmit = () => {
        startTransition(async () => {
            const input = { title, description, videoUrl }
            const res =
                mode === "create"
                    ? await createLesson(moduleId!, input)
                    : await updateLesson(lesson!.id, input)
            if (res.success) {
                toast.success(mode === "create" ? "Aula criada" : "Aula atualizada")
                setOpen(false)
            } else {
                toast.error(res.error)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Nova aula" : "Editar aula"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="lesson-title">Título</Label>
                        <Input
                            id="lesson-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Boas-vindas à empresa"
                            className="border-white/10 bg-black/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lesson-video">URL do vídeo (YouTube ou Google Drive)</Label>
                        <Input
                            id="lesson-video"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtu.be/... ou https://drive.google.com/file/d/..."
                            className="border-white/10 bg-black/40"
                        />
                        {videoUrl && !videoInfo ? (
                            <p className="text-xs text-red-400">Link não reconhecido. Use YouTube ou Google Drive.</p>
                        ) : null}
                        {videoInfo?.type === "youtube" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={`https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`}
                                alt="Pré-visualização do vídeo"
                                className="mt-2 aspect-video w-full rounded-lg border border-white/10 object-cover"
                            />
                        ) : videoInfo?.type === "drive" ? (
                            <p className="text-xs text-emerald-400 mt-1">Link do Google Drive reconhecido.</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lesson-desc">Descrição</Label>
                        <Textarea
                            id="lesson-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Conteúdo/resumo da aula (opcional)"
                            className="resize-none border-white/10 bg-black/40"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !title.trim() || !videoInfo}
                        className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-2"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {mode === "create" ? "Criar aula" : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
