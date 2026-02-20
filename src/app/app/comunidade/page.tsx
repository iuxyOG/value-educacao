import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PostComposer } from "@/components/community/post-composer"
import { PostCard } from "@/components/community/post-card"
import { Users, Search, TrendingUp } from "lucide-react"

export default async function CommunityFeedPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const userObj = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, image: true, role: true }
    })

    if (!userObj) return redirect("/login")

    // Fetch posts
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 30, // Limit for now
        include: {
            user: { select: { id: true, name: true, image: true, role: true } },
            likes: { select: { id: true, userId: true } },
            comments: {
                orderBy: { createdAt: "asc" },
                include: {
                    user: { select: { id: true, name: true, image: true } }
                }
            }
        }
    })

    return (
        <div className="max-w-[1540px] mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Users className="text-[#ff6a1a]" size={32} />
                    Comunidade
                </h1>
                <p className="mt-2 text-zinc-400">Troque experiências, tire dúvidas e conecte-se com outros alunos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Feed */}
                <div className="lg:col-span-8">
                    <PostComposer userInitial={userObj.name ? userObj.name.charAt(0) : "U"} />

                    <div className="space-y-6">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                <Users size={48} className="mb-4 text-zinc-600 opacity-50" />
                                <p className="text-lg font-medium">O feed está vazio.</p>
                                <p className="text-sm">Seja o primeiro a compartilhar algo com a comunidade!</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={session.user.id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Search / Filters (Placeholder) */}
                    <div className="border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar discussões..."
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff6a1a]"
                            />
                        </div>
                    </div>

                    {/* Trending Topics */}
                    <div className="border border-white/5 rounded-2xl bg-[#09090b] p-6 shadow-xl">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="text-[#ff6a1a]" size={18} />
                            Tópicos em Alta
                        </h3>

                        <div className="space-y-4">
                            {[
                                { tag: "dúvidas-plataforma", count: 12 },
                                { tag: "dicas-de-vendas", count: 8 },
                                { tag: "networking", count: 5 },
                                { tag: "feedback-aulas", count: 3 }
                            ].map(topic => (
                                <div key={topic.tag} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#ff6a1a] font-bold opacity-70">#</span>
                                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{topic.tag}</span>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">{topic.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Community Guidelines */}
                    <div className="border border-[#ff6a1a]/20 bg-gradient-to-b from-[#ff6a1a]/10 to-transparent rounded-2xl p-6 shadow-xl text-sm leading-relaxed text-zinc-400">
                        <h4 className="font-bold text-[#ff6a1a] mb-2">Regras da Comunidade</h4>
                        <ol className="list-decimal list-inside space-y-2 font-medium">
                            <li>Seja respeitoso com todos os membros.</li>
                            <li>Evite fazer spam ou autopromoção agressiva.</li>
                            <li>Ajude outros alunos sempre que possível.</li>
                            <li>Mantenha as discussões focadas no aprendizado e educação corporativa.</li>
                        </ol>
                    </div>

                </div>
            </div>
        </div>
    )
}
