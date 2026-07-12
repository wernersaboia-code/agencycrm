import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Easy Prospect — Listas qualificadas de importadores e distribuidores"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0b0b12 0%, #15151f 100%)",
                    color: "#fff",
                    fontFamily: "sans-serif",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 24,
                    }}
                >
                    <div
                        style={{
                            width: 96,
                            height: 96,
                            borderRadius: 20,
                            background: "#111827",
                            border: "2px solid rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 44,
                            fontWeight: 800,
                        }}
                    >
                        EP
                    </div>
                    <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
                        Easy Prospect
                    </div>
                </div>
                <div
                    style={{
                        marginTop: 32,
                        fontSize: 28,
                        color: "#b8b7c9",
                        maxWidth: 820,
                        textAlign: "center",
                    }}
                >
                    Listas qualificadas de importadores e distribuidores para o seu comércio internacional
                </div>
            </div>
        ),
        size
    )
}
