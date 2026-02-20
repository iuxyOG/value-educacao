import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Sidebar } from "@/components/sidebar"
import { LogOut } from "lucide-react"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen bg-[#09090b] text-zinc-50 font-sans">
            {/* Desktop Sidebar */}
            <Sidebar user={{ name: session.user.name, email: session.user.email }} />

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0a0c] px-4 lg:hidden sticky top-0 z-40">
                    <Logo className="scale-[0.6] origin-left" />
                    <div className="flex items-center gap-4">
                        <form action={async () => {
                            "use server"
                            await signOut()
                        }}>
                            <Button type="submit" variant="ghost" size="icon" className="text-zinc-400">
                                <LogOut size={18} />
                            </Button>
                        </form>
                    </div>
                </header>

                <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
