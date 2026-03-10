import { createContext, useContext, useState, type ReactNode } from 'react'

type AddModalContextValue = {
  openAddModal: () => void
  closeAddModal: () => void
  isAddModalOpen: boolean
}

const AddModalContext = createContext<AddModalContextValue | null>(null)

export function AddModalProvider({ children }: { children: ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  return (
    <AddModalContext.Provider
      value={{
        openAddModal: () => setIsAddModalOpen(true),
        closeAddModal: () => setIsAddModalOpen(false),
        isAddModalOpen,
      }}
    >
      {children}
    </AddModalContext.Provider>
  )
}

export function useAddModal() {
  const ctx = useContext(AddModalContext)
  if (!ctx) throw new Error('useAddModal must be used within AddModalProvider')
  return ctx
}
