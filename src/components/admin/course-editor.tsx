"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
    createModule,
    updateModule,
    deleteModule,
    reorderModule,
    setCoursePublished,
    deleteLesson,
    reorderLesson,
} from "@/app/admin/actions"
import { CourseFormDialog } from "./course-form"
import { LessonDialog } from "./lesson-dialog"
import { DeleteConfirm } from "./delete-confirm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, PlayCircle, Check, X } from "lucide-react"

type EditorLesson = { id: string; title: string; order: number; youtubeVideoId: string; description: string | null }
type EditorModule = { id: string; title: string; order: number; lessons: EditorLesson[] }
type EditorCourse = {
    id: string
    title: string
    slug: string
    description: string | null
    coverImage: string | null
    audience: "GESTOR" | "VENDEDOR"
    published: boolean
    archived: boolean
    modules: EditorModule[]
}

export function CourseEditor({ course }: { course: EditorCourse }) {
    const [isPending, startTransition] = useTransition()
    const [newModuleTitle, setNewModuleTitle] = useState("")

    const addModule = () => {
        const title = newModuleTitle.trim()
        if (!title) return
        startTransition(async () => {
            const res = await createModule(course.id, { title })
            if (res.success) {
                toast.success("Módulo criado")
                setNewModuleTitle("")
            } else {
                toast.error(res.error)
            }
        })
    }

    const togglePublished = (next: boolean) => {
        startTransition(async () => {
            const res = await setCoursePublished(course.id, next)
            if (res.success) toast.success(next ? "Curso publicado" : "Curso despublicado")
            else toast.error(res.error)
        })
    }

    return (
        <div className="space-y-8">
            <div>
                <Button asChild variant="ghost" className="mb-4 -ml-2 gap-2 text-zinc-400 hover:text-white">
                    <Link href="/admin">
                        <ArrowLeft size={16} /> Todos os cursos
                    </Link>
                </Button>

                <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/5 bg-[#0d0d0f] p-6">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="rounded border border-[#ff6a1a]/20 bg-[#ff6a1a]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#ff6a1a]">
                                {course.audience}
                            </span>
                            {course.archived ? (
                                <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    Arquivado
                                </span>
                            ) : null}
                        </div>
                        <h1 className="text-2xl font-black text-white">{course.title}</h1>
                        {course.description ? <p className="mt-1 max-w-xl text-sm text-zinc-400">{course.description}</p> : null}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                            <span className="text-xs font-semibold text-zinc-300">{course.published ? "Publicado" : "Rascunho"}</span>
                            <Switch checked={course.published} onCheckedChange={togglePublished} disabled={isPending} />
                        </div>
                        <CourseFormDialog
                            mode="edit"
                            course={course}
                            trigger={
                                <Button variant="outline" className="gap-2 border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">
                                    <Pencil size={16} /> Editar
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Título do novo módulo"
                    className="border-white/10 bg-black/40"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") addModule()
                    }}
                />
                <Button onClick={addModule} disabled={isPending || !newModuleTitle.trim()} className="shrink-0 gap-2 bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold">
                    <Plus size={16} /> Módulo
                </Button>
            </div>

            {course.modules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-16 text-center text-zinc-500">
                    <p className="font-medium text-zinc-300">Nenhum módulo ainda.</p>
                    <p className="mt-1 text-sm">Crie um módulo acima para adicionar aulas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {course.modules.map((m, i) => (
                        <ModuleItem key={m.id} module={m} index={i} total={course.modules.length} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ModuleItem({ module, index, total }: { module: EditorModule; index: number; total: number }) {
    const [isPending, startTransition] = useTransition()
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(module.title)

    const saveTitle = () => {
        const t = title.trim()
        if (!t) return
        startTransition(async () => {
            const res = await updateModule(module.id, { title: t })
            if (res.success) {
                toast.success("Módulo atualizado")
                setEditing(false)
            } else {
                toast.error(res.error)
            }
        })
    }

    const move = (dir: "up" | "down") =>
        startTransition(async () => {
            const res = await reorderModule(module.id, dir)
            if (!res.success) toast.error(res.error)
        })

    return (
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0d0d0f]">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <div className="flex flex-col">
                    <button type="button" onClick={() => move("up")} disabled={isPending || index === 0} aria-label="Mover módulo para cima" className="text-zinc-500 hover:text-white disabled:opacity-30">
                        <ChevronUp size={14} />
                    </button>
                    <button type="button" onClick={() => move("down")} disabled={isPending || index === total - 1} aria-label="Mover módulo para baixo" className="text-zinc-500 hover:text-white disabled:opacity-30">
                        <ChevronDown size={14} />
                    </button>
                </div>

                {editing ? (
                    <div className="flex flex-1 items-center gap-2">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            className="h-8 border-white/10 bg-black/40"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle()
                                if (e.key === "Escape") {
                                    setTitle(module.title)
                                    setEditing(false)
                                }
                            }}
                        />
                        <button type="button" onClick={saveTitle} disabled={isPending} aria-label="Salvar" className="text-[#ff6a1a] hover:text-[#ff6a1a]/80">
                            <Check size={16} />
                        </button>
                        <button type="button" onClick={() => { setTitle(module.title); setEditing(false) }} aria-label="Cancelar" className="text-zinc-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-white">{module.title}</span>
                            <span className="ml-2 text-xs text-zinc-500">{module.lessons.length} aulas</span>
                        </div>
                        <button type="button" onClick={() => setEditing(true)} aria-label="Renomear módulo" className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white">
                            <Pencil size={14} />
                        </button>
                        <DeleteConfirm
                            trigger={
                                <button type="button" aria-label="Excluir módulo" className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500">
                                    <Trash2 size={14} />
                                </button>
                            }
                            title="Excluir módulo?"
                            description={`O módulo “${module.title}” e suas ${module.lessons.length} aula(s) serão removidos permanentemente, junto com o progresso dos alunos nessas aulas.`}
                            successMessage="Módulo excluído"
                            action={() => deleteModule(module.id)}
                        />
                    </>
                )}
            </div>

            <div className="space-y-2 p-4">
                {module.lessons.length === 0 ? (
                    <p className="py-2 text-center text-xs text-zinc-600">Nenhuma aula neste módulo.</p>
                ) : (
                    module.lessons.map((l, li) => <LessonItem key={l.id} lesson={l} index={li} total={module.lessons.length} />)
                )}
                <LessonDialog
                    mode="create"
                    moduleId={module.id}
                    trigger={
                        <Button variant="outline" className="mt-1 w-full gap-2 border-dashed border-white/10 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white">
                            <Plus size={16} /> Adicionar aula
                        </Button>
                    }
                />
            </div>
        </div>
    )
}

function LessonItem({ lesson, index, total }: { lesson: EditorLesson; index: number; total: number }) {
    const [isPending, startTransition] = useTransition()

    const move = (dir: "up" | "down") =>
        startTransition(async () => {
            const res = await reorderLesson(lesson.id, dir)
            if (!res.success) toast.error(res.error)
        })

    return (
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <div className="flex flex-col">
                <button type="button" onClick={() => move("up")} disabled={isPending || index === 0} aria-label="Mover aula para cima" className="text-zinc-500 hover:text-white disabled:opacity-30">
                    <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => move("down")} disabled={isPending || index === total - 1} aria-label="Mover aula para baixo" className="text-zinc-500 hover:text-white disabled:opacity-30">
                    <ChevronDown size={14} />
                </button>
            </div>
            <PlayCircle size={16} className="shrink-0 text-[#ff6a1a]" />
            <span className="flex-1 truncate text-sm text-zinc-200">{lesson.title}</span>
            <LessonDialog
                mode="edit"
                lesson={lesson}
                trigger={
                    <button type="button" aria-label="Editar aula" className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white">
                        <Pencil size={14} />
                    </button>
                }
            />
            <DeleteConfirm
                trigger={
                    <button type="button" aria-label="Excluir aula" className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500">
                        <Trash2 size={14} />
                    </button>
                }
                title="Excluir aula?"
                description={`A aula “${lesson.title}” será removida permanentemente, junto com o progresso e anotações dos alunos nela.`}
                successMessage="Aula excluída"
                action={() => deleteLesson(lesson.id)}
            />
        </div>
    )
}
