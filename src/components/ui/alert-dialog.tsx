import { ReactNode } from 'react'

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function AlertDialog({
  open,
  onClose,
  children,
}: AlertDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative z-10 max-w-[95vw] max-h-[95vh]">
        {children}
      </div>
    </div>
  )
}
