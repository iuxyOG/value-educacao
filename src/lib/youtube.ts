const YT_ID = /^[a-zA-Z0-9_-]{11}$/

/**
 * Extrai o ID de 11 caracteres de um vídeo do YouTube a partir de uma URL
 * (watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/) ou de um ID já puro.
 * Vídeos "não listados" embedam normalmente via /embed/{id}.
 * Retorna null se não conseguir extrair um ID válido.
 */
export function extractYouTubeId(input: string): string | null {
    if (!input) return null
    const s = input.trim()
    if (YT_ID.test(s)) return s

    let url: URL
    try {
        url = new URL(s.startsWith("http") ? s : `https://${s}`)
    } catch {
        return null
    }

    const host = url.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
        const id = url.pathname.slice(1, 12)
        return YT_ID.test(id) ? id : null
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        const v = url.searchParams.get("v")
        if (v && YT_ID.test(v)) return v
        const m = url.pathname.match(/\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/)
        if (m && YT_ID.test(m[1])) return m[1]
    }

    return null
}
