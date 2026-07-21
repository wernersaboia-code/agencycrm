import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

// Sem `runtime = "edge"`: a logo é lida do disco, o que o runtime edge não permite.
export const alt = "Easy Prospect — Listas qualificadas de importadores e distribuidores"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
    const logoBase64 = readFileSync(join(process.cwd(), "public/logo-icon.png")).toString("base64")

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
                    background: "linear-gradient(135deg, #001a28 0%, #003048 100%)",
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`data:image/png;base64,${logoBase64}`}
                        width={96}
                        height={96}
                        alt=""
                        style={{ borderRadius: 20 }}
                    />
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
