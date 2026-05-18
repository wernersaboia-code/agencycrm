"use client"

import { motion, type Variants, useInView, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

// ============================================================
// PAGE TRANSITIONS
// ============================================================

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================================
// STAGGER CONTAINER
// ============================================================

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05,
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// ============================================================
// ANIMATED COUNTER
// ============================================================

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  decimals?: number
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const hasStartedRef = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true
          // Use rAF to avoid setState in effect warning
          requestAnimationFrame(() => {
            if (shouldReduceMotion) {
              setDisplayValue(value)
              return
            }

            let startTime: number | null = null

            const animate = (timestamp: number) => {
              if (!startTime) startTime = timestamp
              const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

              const easeOut = 1 - Math.pow(1 - progress, 3)
              setDisplayValue(easeOut * value)

              if (progress < 1) {
                requestAnimationFrame(animate)
              }
            }

            requestAnimationFrame(animate)
          })
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value, duration, shouldReduceMotion])

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString("pt-BR")

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

// ============================================================
// HOVER CARD (elevation + glow)
// ============================================================

interface HoverCardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export function HoverCard({ children, className, glow = true }: HoverCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -2,
              scale: 1.005,
              transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : { scale: 0.995, transition: { duration: 0.1 } }
      }
      className={className}
      style={{
        boxShadow: glow
          ? "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)"
          : undefined,
      }}
    >
      {children}
    </motion.div>
  )
}

// ============================================================
// ANIMATED BUTTON
// ============================================================

interface AnimatedButtonProps {
  children: React.ReactNode
  className?: string
  variant?: "primary" | "secondary" | "ghost"
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export function AnimatedButton({
  children,
  className,
  variant = "primary",
  onClick,
  disabled,
  type = "button",
}: AnimatedButtonProps) {
  const shouldReduceMotion = useReducedMotion()

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors"

  const variantClasses = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
    secondary:
      "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
  }

  return (
    <motion.button
      whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`${baseClasses} ${variantClasses[variant]} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  )
}

// ============================================================
// FADE IN VIEW (scroll-triggered)
// ============================================================

interface FadeInViewProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  id?: string
}

export function FadeInView({
  children,
  className,
  delay = 0,
  direction = "up",
  id,
}: FadeInViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div className={className} id={id}>
        {children}
      </div>
    )
  }

  const directionOffset = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { y: 0, x: 24 },
    right: { y: 0, x: -24 },
    none: { y: 0, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: directionOffset[direction].y,
        x: directionOffset[direction].x,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              x: 0,
              transition: {
                duration: 0.5,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              },
            }
          : undefined
      }
      className={className}
      id={id}
    >
      {children}
    </motion.div>
  )
}
