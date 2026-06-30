type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/**
 * Rate limiter simples em memória (best-effort).
 *
 * Suficiente para conter spam/abuso numa instância única (Railway). Observação:
 * o estado é por processo — reinicia a cada deploy e não é compartilhado entre
 * múltiplas instâncias. Para limites fortes/distribuídos, usar Redis (ex.: Upstash).
 *
 * @param key      Identificador do limite (ex.: `post:<userId>`).
 * @param limit    Máximo de ações permitidas na janela.
 * @param windowMs Tamanho da janela em milissegundos.
 * @returns        true se a ação é permitida; false se excedeu o limite.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || now >= bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        sweep(now)
        return true
    }

    if (bucket.count >= limit) return false

    bucket.count += 1
    return true
}

// Remove buckets expirados para evitar crescimento ilimitado do Map.
// Usa forEach (compatível com o target atual do tsconfig) em vez de for..of.
function sweep(now: number) {
    if (buckets.size < 5000) return
    buckets.forEach((bucket, key) => {
        if (now >= bucket.resetAt) buckets.delete(key)
    })
}
