"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createCourse, updateCourse } from "@/app/admin/actions"
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
import { Switch } from "@/components/ui/switch"
import { Loader2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

type CourseData = {
    id: string
    title: string
    description: string | null
    coverImage: string | null
    audience: "GESTOR" | "VENDEDOR"
    published: boolean
}

const AUDIENCES = [
    { value: "VENDEDOR", label: "Vendedor" },
    { value: "GESTOR", label: "Gestor" },
] as const

export function CourseFormDialog({
    mode,
    course,
    trigger,
}: {
    mode: "create" | "edit"
    course?: CourseData
    trigger: React.ReactNode
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState(course?.title ?? "")
    const [description, setDescription] = useState(course?.description ?? "")
    const [coverImage, setCoverImage] = useState(course?.coverImage ?? "")
    const [audience, setAudience] = useState<"GESTOR" | "VENDEDOR">(course?.audience ?? "VENDEDOR")
    const [published, setPublished] = useState(course?.published ?? false)
    const fileRef = useRef<HTMLInputElement>(null)

    // Redimensiona/compacta no navegador e guarda como data URL (sem storage externo).
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = "" // permite re-selecionar o mesmo arquivo
        if (!file) return
        if (!file.type.startsWith("image/")) {
            toast.error("Selecione um arquivo de imagem.")
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const img = new Image()
            img.onload = () => {
                const maxDim = 1000
                let { width, height } = img
                if (width > maxDim || height > maxDim) {
                    const scale = maxDim / Math.max(width, height)
                    width = Math.round(width * scale)
                    height = Math.round(height * scale)
                }
                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    toast.error("Não foi possível processar a imagem.")
                    return
                }
                ctx.fillStyle = "#ffffff"
                ctx.fillRect(0, 0, width, height)
                ctx.drawImage(img, 0, 0, width, height)
                setCoverImage(canvas.toDataURL("image/jpeg", 0.7))
            }
            img.onerror = () => toast.error("Imagem inválida.")
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = () => {
        startTransition(async () => {
            const input = { title, description, coverImage, audience, published }
            const res = mode === "create" ? await createCourse(input) : await updateCourse(course!.id, input)
            if (res.success) {
                toast.success(mode === "create" ? "Curso criado" : "Curso atualizado")
                setOpen(false)
                if (mode === "create" && "courseId" in res) {
                    router.push(`/admin/cursos/${res.courseId}`)
                }
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
                    <DialogTitle>{mode === "create" ? "Novo curso" : "Editar curso"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="course-title">Título</Label>
                        <Input
                            id="course-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Onboarding de Vendas"
                            className="border-white/10 bg-black/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course-desc">Descrição</Label>
                        <Textarea
                            id="course-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Resumo do curso (opcional)"
                            className="resize-none border-white/10 bg-black/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Capa do curso</Label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                        {coverImage.startsWith("data:") ? (
                            <div className="flex items-center gap-3 text-xs">
                                <span className="font-semibold text-[#ff6a1a]">Imagem enviada ✓</span>
                                <button type="button" onClick={() => fileRef.current?.click()} className="text-zinc-400 underline hover:text-white">trocar</button>
                                <button type="button" onClick={() => setCoverImage("")} className="text-zinc-400 underline hover:text-white">remover</button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileRef.current?.click()}
                                    className="gap-2 border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
                                >
                                    <Upload size={16} /> Enviar imagem
                                </Button>
                                <Input
                                    value={coverImage}
                                    onChange={(e) => setCoverImage(e.target.value)}
                                    placeholder="ou cole uma URL https://..."
                                    className="border-white/10 bg-black/40"
                                />
                            </div>
                        )}
                        {coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverImage} alt="Pré-visualização da capa" className="mt-2 h-28 w-full rounded-lg border border-white/10 object-cover" />
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label>Público-alvo</Label>
                        <div className="flex gap-2">
                            {AUDIENCES.map((a) => (
                                <button
                                    key={a.value}
                                    type="button"
                                    onClick={() => setAudience(a.value)}
                                    className={cn(
                                        "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                                        audience === a.value
                                            ? "border-[#ff6a1a]/40 bg-[#ff6a1a]/10 text-[#ff6a1a]"
                                            : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white"
                                    )}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-white">Publicado</p>
                            <p className="text-xs text-zinc-500">Visível para os alunos do perfil.</p>
                        </div>
                        <Switch checked={published} onCheckedChange={setPublished} />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !title.trim()}
                        className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-2"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {mode === "create" ? "Criar curso" : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
