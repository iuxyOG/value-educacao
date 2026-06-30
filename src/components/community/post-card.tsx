"use client"

import { useOptimistic, useState, useTransition } from "react"
import { toggleLike, createComment } from "@/app/actions/community"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, Send, Loader2, MoreHorizontal } from "lucide-react"

type CommentData = {
    id: string
    content: string
    createdAt: Date
    user: { id: string; name: string | null; image: string | null }
}

type PostData = {
    id: string
    content: string
    createdAt: Date
    user: { id: string; name: string | null; image: string | null; role: string }
    // Apenas a curtida do usuário atual (se houver) — usada para saber se já curtiu.
    likes: { id: string }[]
    comments: CommentData[]
    _count: { likes: number; comments: number }
}

export function PostCard({ post }: { post: PostData }) {
    const [isCommenting, setIsCommenting] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [isPendingLike, startLikeTransition] = useTransition()
    const [isPendingComment, startCommentTransition] = useTransition()

    const hasLiked = post.likes.length > 0

    // Estado base derivado das props (atualizadas via revalidatePath). useOptimistic
    // mostra a curtida na hora e reconcilia com o servidor — antes o useState(props)
    // congelava no mount e o contador divergia do banco.
    const [optimisticLike, applyLike] = useOptimistic(
        { liked: hasLiked, count: post._count.likes },
        (state, nextLiked: boolean) => ({
            liked: nextLiked,
            count: state.count + (nextLiked ? 1 : -1),
        })
    )

    const handleLike = () => {
        startLikeTransition(async () => {
            applyLike(!optimisticLike.liked)
            await toggleLike(post.id)
            // Sucesso: revalidatePath atualiza as props. Falha: o otimista é revertido.
        })
    }

    const handleComment = () => {
        if (!commentText.trim() || isPendingComment) return

        startCommentTransition(async () => {
            const res = await createComment(post.id, commentText.trim())
            if (res.success) {
                setCommentText("")
                setIsCommenting(false)
            } else {
                alert(res.error ?? "Erro ao enviar comentário.")
            }
        })
    }

    return (
        <div className="border border-white/5 bg-[#09090b] rounded-2xl p-6 shadow-xl mb-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1a1a1c] to-[#2a2a2c] flex items-center justify-center text-sm font-bold text-white shadow-inner border border-white/10">
                        {post.user.name?.charAt(0) || "U"}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            {post.user.name || "Aluno"}
                            {post.user.role === "ADMIN" && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff6a1a]/20 text-[#ff6a1a] uppercase tracking-wider">Staff</span>
                            )}
                        </h4>
                        <p className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-8 w-8" aria-label="Mais opções">
                    <MoreHorizontal size={18} />
                </Button>
            </div>

            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line mb-6">
                {post.content}
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <button
                    onClick={handleLike}
                    disabled={isPendingLike}
                    className={`flex items-center gap-2 text-sm font-semibold transition-colors ${optimisticLike.liked ? "text-[#ff6a1a]" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    <Heart size={18} className={optimisticLike.liked ? "fill-current" : ""} />
                    {optimisticLike.count} Curtidas
                </button>

                <button
                    onClick={() => setIsCommenting(!isCommenting)}
                    className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <MessageSquare size={18} />
                    {post._count.comments} Comentários
                </button>
            </div>

            {/* Comments Section */}
            {(isCommenting || post.comments.length > 0) && (
                <div className="mt-6 pt-6 border-t border-white/5 space-y-6">
                    {post.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#1a1a1c] flex shrink-0 items-center justify-center text-xs font-bold text-white border border-white/5">
                                {comment.user.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 bg-white/[0.02] p-4 rounded-2xl rounded-tl-none border border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-white text-xs">{comment.user.name || "Aluno"}</span>
                                    <span className="text-[10px] text-zinc-600">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
                                </div>
                                <p className="text-sm text-zinc-400 leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                    ))}

                    {isCommenting && (
                        <div className="flex gap-3 mt-4 items-start">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-[#ff6a1a]/10 flex items-center justify-center text-xs font-bold text-[#ff6a1a] border border-[#ff6a1a]/20">
                                Você
                            </div>
                            <div className="flex-1 flex gap-2">
                                <Textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Escreva um comentário..."
                                    className="min-h-[40px] h-[40px] resize-none bg-white/[0.02] border-white/5 text-sm"
                                />
                                <Button
                                    onClick={handleComment}
                                    disabled={!commentText.trim() || isPendingComment}
                                    size="icon"
                                    className="bg-[#ff6a1a] text-white hover:bg-[#ff6a1a]/90 h-10 w-10 shrink-0"
                                >
                                    {isPendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
