import { NavLink } from 'react-router-dom'
import { AnimatedOutlet } from './AnimatedOutlet'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { AddModalProvider, useAddModal } from '../context/AddModalContext'
import { AddExpenseModal } from './AddExpenseModal'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
]

function LayoutInner() {
  const navRef = useRef<HTMLDivElement>(null)
  const { closeAddModal, isAddModalOpen } = useAddModal()

  useEffect(() => {
    if (!navRef.current) return
    gsap.fromTo(
      navRef.current.children,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
    )
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          <NavLink
            to="/"
            className="font-semibold text-lg tracking-tight text-zinc-100 hover:text-amber-400 transition-colors"
          >
            Expense
          </NavLink>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <div ref={navRef} className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatedOutlet />
      </main>
      {isAddModalOpen && (
        <AddExpenseModal onClose={closeAddModal} onSuccess={closeAddModal} />
      )}
    </div>
  )
}

export function Layout() {
  return (
    <AddModalProvider>
      <LayoutInner />
    </AddModalProvider>
  )
}
