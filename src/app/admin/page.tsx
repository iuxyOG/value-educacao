import { prisma } from "@/lib/prisma"
import { CourseList } from "@/components/admin/course-list"

// Gate de role fica no admin/layout.tsx; as server actions também gateiam (defesa em profundidade).
export default async function AdminPage() {
    const courses = await prisma.course.findMany({
        orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
        include: {
            _count: { select: { modules: true } },
            modules: { select: { _count: { select: { lessons: true } } } },
        },
    })

    return <CourseList courses={courses} />
}
