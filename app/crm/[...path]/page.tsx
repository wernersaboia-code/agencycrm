import { redirect } from "next/navigation"

interface LegacyCrmPathPageProps {
    params: Promise<{ path: string[] }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LegacyCrmPathPage({
    params,
    searchParams,
}: LegacyCrmPathPageProps) {
    const { path } = await params
    const query = await searchParams
    const nextPath = `/${path.join("/")}`
    const nextSearchParams = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => nextSearchParams.append(key, item))
            return
        }

        if (value) {
            nextSearchParams.set(key, value)
        }
    })

    const queryString = nextSearchParams.toString()

    redirect(queryString ? `${nextPath}?${queryString}` : nextPath)
}
