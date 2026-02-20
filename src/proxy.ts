
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnApp = req.nextUrl.pathname.startsWith("/app")
    const isOnLogin = req.nextUrl.pathname.startsWith("/login")

    if (isOnApp) {
        if (isLoggedIn) return
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    if (isOnLogin) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/app", req.nextUrl))
        }
        return
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
