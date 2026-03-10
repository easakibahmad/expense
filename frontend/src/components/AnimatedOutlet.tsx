import { useRef, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { gsap } from 'gsap'

export function AnimatedOutlet() {
  const location = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mainRef.current) return
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    )
  }, [location.pathname])

  return (
    <div ref={mainRef} className="min-h-0">
      <Outlet />
    </div>
  )
}
