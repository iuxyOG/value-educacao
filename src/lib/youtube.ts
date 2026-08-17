const YT_ID = /^[a-zA-Z0-9_-]{11}$/
const DRIVE_ID = /^[a-zA-Z0-9_-]{25,}$/

export type VideoInfo =
    | { type: "youtube"; id: string }
    | { type: "drive"; id: string }

/**
 * Extrai informações de vídeo de uma URL do YouTube ou Google Drive.
 * YouTube: watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/
 * Drive: /file/d/{ID}/view, /file/d/{ID}/preview, ?id={ID}
 * Retorna null se não reconhecer.
 */
export function extractVideoInfo(input: string): VideoInfo | null {
    if (!input) return null
    const s = input.trim()

    if (YT_ID.test(s)) return { type: "youtube", id: s }

    let url: URL
    try {
        url = new URL(s.startsWith("http") ? s : `https://${s}`)
    } catch {
        return null
    }

    const host = url.hostname.replace(/^www\./, "")

    // YouTube
    if (host === "youtu.be") {
        const id = url.pathname.slice(1, 12)
        return YT_ID.test(id) ? { type: "youtube", id } : null
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        const v = url.searchParams.get("v")
        if (v && YT_ID.test(v)) return { type: "youtube", id: v }
        const m = url.pathname.match(/\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/)
        if (m && YT_ID.test(m[1])) return { type: "youtube", id: m[1] }
    }

    // Google Drive
    if (host === "drive.google.com") {
        const m = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (m && DRIVE_ID.test(m[1])) return { type: "drive", id: m[1] }
        const id = url.searchParams.get("id")
        if (id && DRIVE_ID.test(id)) return { type: "drive", id }
    }

    return null
}

/**
 * Detecta o tipo de um ID já armazenado no banco (sem URL).
 * YouTube IDs têm exatamente 11 chars; Drive IDs têm 25+.
 */
export function storedIdToInfo(storedId: string): VideoInfo | null {
    if (!storedId) return null
    if (YT_ID.test(storedId)) return { type: "youtube", id: storedId }
    if (DRIVE_ID.test(storedId)) return { type: "drive", id: storedId }
    return null
}

/** Backward compat — retorna apenas IDs do YouTube. */
export function extractYouTubeId(input: string): string | null {
    const info = extractVideoInfo(input)
    return info?.type === "youtube" ? info.id : null
}
