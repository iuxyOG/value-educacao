import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserList } from "@/components/admin/user-list"

export default async function UsersPage() {
    const session = await auth()
    if (!session?.user?.id) return null // o admin/layout já protege; isto é só para o tipo

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return <UserList users={users} currentUserId={session.user.id} />
}
