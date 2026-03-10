import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

interface PageTitleProps {
  title: string
  subtitle?: React.ReactNode
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!titleRef.current) return
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      )
      if (subtitle && subRef.current) {
        gsap.fromTo(
          subRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: 'power2.out' }
        )
      }
    }
  }, [title, subtitle])

  return (
    <header className="mb-8">
      <h1 ref={titleRef} className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p ref={subRef} className="mt-1 text-zinc-500 text-sm sm:text-base">
          {subtitle}
        </p>
      )}
    </header>
  )
}
