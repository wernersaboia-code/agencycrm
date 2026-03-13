// components/calls/hooks/useCallTimer.ts

"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// ============================================
// TYPES
// ============================================

interface UseCallTimerReturn {
    /** Tempo em segundos */
    elapsedSeconds: number
    /** Tempo formatado (HH:MM:SS) */
    formattedTime: string
    /** Timer está rodando? */
    isRunning: boolean
    /** Inicia o timer */
    start: () => void
    /** Para o timer e retorna os segundos */
    stop: () => number
    /** Reseta o timer */
    reset: () => void
    /** Pausa o timer */
    pause: () => void
    /** Retoma o timer pausado */
    resume: () => void
}

// ============================================
// HELPER
// ============================================

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
}

// ============================================
// HOOK
// ============================================

export function useCallTimer(): UseCallTimerReturn {
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const startTimeRef = useRef<number | null>(null)
    const pausedTimeRef = useRef<number>(0)

    // Limpa interval ao desmontar
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Atualiza o timer a cada segundo
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    const now = Date.now()
                    const elapsed = Math.floor((now - startTimeRef.current) / 1000) + pausedTimeRef.current
                    setElapsedSeconds(elapsed)
                }
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning])

    const start = useCallback((): void => {
        startTimeRef.current = Date.now()
        pausedTimeRef.current = 0
        setElapsedSeconds(0)
        setIsRunning(true)
    }, [])

    const stop = useCallback((): number => {
        setIsRunning(false)
        const finalSeconds = elapsedSeconds
        return finalSeconds
    }, [elapsedSeconds])

    const reset = useCallback((): void => {
        setIsRunning(false)
        setElapsedSeconds(0)
        startTimeRef.current = null
        pausedTimeRef.current = 0
    }, [])

    const pause = useCallback((): void => {
        if (isRunning) {
            pausedTimeRef.current = elapsedSeconds
            setIsRunning(false)
        }
    }, [isRunning, elapsedSeconds])

    const resume = useCallback((): void => {
        if (!isRunning && pausedTimeRef.current > 0) {
            startTimeRef.current = Date.now()
            setIsRunning(true)
        }
    }, [isRunning])

    return {
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
        isRunning,
        start,
        stop,
        reset,
        pause,
        resume,
    }
}