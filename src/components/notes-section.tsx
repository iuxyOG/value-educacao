"use client"

import { useOptimistic, useState, useTransition } from "react"
import { createNote, deleteNote } from "@/app/actions/notes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Plus, Trash2, Loader2, StickyNote } from "lucide-react"

interface Note {
    id: string
    content: string
    timestamp: number | null
    createdAt: Date
}

interface NotesSectionProps {
    lessonId: string
    initialNotes: Note[]
}

type NoteAction =
    | { type: "add"; note: Note }
    | { type: "delete"; id: string }

function formatTimestamp(seconds: number | null) {
    if (seconds === null) return ""
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function NotesSection({ lessonId, initialNotes }: NotesSectionProps) {
    const [content, setContent] = useState("")
    const [isPending, startTransition] = useTransition()
    // In a real implementation with a video player ref, we could grab the actual timestamp
    const [currentVideoTime, setCurrentVideoTime] = useState<number | null>(null)

    // initialNotes vem do servidor e é atualizado via revalidatePath após cada ação.
    // useOptimistic aplica a mudança na hora e reconcilia com a lista revalidada
    // (assim o id temporário é substituído pelo id real e o delete passa a funcionar).
    const [notes, applyOptimistic] = useOptimistic(
        initialNotes,
        (state: Note[], action: NoteAction) => {
            if (action.type === "add") return [action.note, ...state]
            return state.filter((n) => n.id !== action.id)
        }
    )

    const handleCreateNote = () => {
        const noteContent = content.trim()
        if (!noteContent) return
        const timestamp = currentVideoTime

        startTransition(async () => {
            applyOptimistic({
                type: "add",
                note: {
                    id: `temp-${Date.now()}`,
                    content: noteContent,
                    timestamp,
                    createdAt: new Date(),
                },
            })
            setContent("")

            const result = await createNote(lessonId, noteContent, timestamp ?? undefined)

            // Em caso de falha (validação/limite/sem acesso) o estado otimista é
            // descartado ao fim da transition; devolvemos o texto para nova tentativa.
            if (!result.success) {
                setContent(noteContent)
            }
        })
    }

    const handleDeleteNote = (noteId: string) => {
        startTransition(async () => {
            applyOptimistic({ type: "delete", id: noteId })
            await deleteNote(noteId)
            // Sucesso: revalidatePath atualiza a lista base. Falha: o otimista é revertido.
        })
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Note Input Area */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <StickyNote size={16} className="text-[#ff6a1a]" />
                        Adicionar Anotação
                    </h3>

                    <button
                        onClick={() => setCurrentVideoTime(currentVideoTime ? null : 125)} // Mocking grabbing timestamp (02:05)
                        className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${currentVideoTime
                            ? "bg-[#ff6a1a]/10 border-[#ff6a1a]/30 text-[#ff6a1a]"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                            }`}
                    >
                        <Clock size={12} />
                        {currentVideoTime ? `Salvar no min ${formatTimestamp(currentVideoTime)}` : "Vincular a um minuto"}
                    </button>
                </div>

                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva seu resumo, insight ou dúvida sobre este momento da aula..."
                    className="min-h-[100px] resize-none border-white/10 bg-black/40 p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-[#ff6a1a]/30"
                />

                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={handleCreateNote}
                        disabled={isPending || !content.trim()}
                        className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 font-semibold gap-2 shadow-[#ff6a1a]/20 shadow-lg"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Salvar Anotação
                    </Button>
                </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    Minhas Anotações <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">{notes.length}</span>
                </h4>

                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <StickyNote size={32} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium text-zinc-500">Você ainda não tem anotações nesta aula.</p>
                        <p className="text-xs mt-1">Escreva algo para não esquecer depois!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {notes.map((note) => (
                            <div key={note.id} className="group relative rounded-xl border border-white/5 bg-[#0d0d0f] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.03]">
                                <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        disabled={isPending}
                                        className="rounded-md p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                        title="Excluir anotação"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {note.timestamp !== null && (
                                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#ff6a1a]/20 bg-[#ff6a1a]/10 px-2 py-1 text-[10px] font-bold text-[#ff6a1a]">
                                        <Clock size={12} />
                                        <span>{formatTimestamp(note.timestamp)}</span>
                                    </div>
                                )}

                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 pr-8">
                                    {note.content}
                                </p>

                                <p className="mt-4 text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                                    {new Date(note.createdAt).toLocaleDateString("pt-BR", {
                                        day: "2-digit", month: "long", year: "numeric"
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
