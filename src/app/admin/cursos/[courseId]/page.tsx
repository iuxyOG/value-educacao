import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CourseEditor } from "@/components/admin/course-editor"

export default async function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = await params

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            modules: {
                orderBy: { order: "asc" },
                include: {
                    lessons: { orderBy: { order: "asc" } },
                },
            },
        },
    })

    if (!course) return notFound()

    return <CourseEditor course={course} />
}
