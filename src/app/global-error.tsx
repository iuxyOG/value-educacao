"use client"

import { useEffect } from "react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="pt-BR">
            <body
                style={{
                    margin: 0,
                    background: "#09090b",
                    color: "#fafafa",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1.5rem",
                        textAlign: "center",
                    }}
                >
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
                        Algo deu errado
                    </h1>
                    <p style={{ color: "#a1a1aa", margin: "0 0 2rem", maxWidth: "24rem" }}>
                        Ocorreu um erro inesperado. Tente novamente.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            background: "#ff6a1a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.5rem",
                            padding: "0.75rem 1.5rem",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Tentar novamente
                    </button>
                </div>
            </body>
        </html>
    )
}
