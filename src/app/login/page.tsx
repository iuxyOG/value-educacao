"use client"

import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/app",
            })

            if (result?.error) {
                setError("E-mail ou senha inválidos.")
                return
            }

            router.push(result?.url ?? "/app")
            router.refresh()
        } catch {
            setError("Ocorreu um erro ao entrar. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-[#09090b] text-zinc-50">
            {/* Left side: Minimalist branding */}
            <div className="hidden lg:flex flex-col justify-between border-r border-white/5 bg-[#09090b] p-12 lg:p-16">
                <div>
                    <Logo large />
                </div>
                <div className="space-y-4">
                    <h1 className="text-3xl font-light tracking-tight text-white sm:text-4xl">
                        Acesso por perfil.
                    </h1>
                    <p className="max-w-md text-base leading-relaxed text-zinc-400">
                        Plataforma oficial para treinamento de equipes com padrão profissional, foco em crescimento e navegação simplificada.
                    </p>
                </div>
                <div className="text-sm text-zinc-600">
                    &copy; {new Date().getFullYear()} Value Educação. Todos os direitos reservados.
                </div>
            </div>

            {/* Right side: Login form */}
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16">
                <div className="w-full max-w-[380px] space-y-8">
                    <div className="space-y-2 lg:hidden">
                        <Logo large className="scale-90 origin-left" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-white">Entrar na plataforma</h2>
                        <p className="text-sm text-zinc-400">Insira suas credenciais para acessar sua conta.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-zinc-300">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11 rounded-md border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-zinc-300">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11 rounded-md border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-transparent transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 h-11 w-full rounded-md bg-[#ff6a1a] text-white font-medium hover:bg-[#ff6a1a]/90 transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
