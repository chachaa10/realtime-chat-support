import { useState, useRef, useEffect } from 'react'
import { Undo2, EllipsisVertical } from 'lucide-react'

interface TicketActionsPopoverProps {
  ticketId: number
  disabled: boolean
  isPending: boolean
  onReturn: () => void
}

export function TicketActionsPopover({ disabled, isPending, onReturn }: TicketActionsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleReturnClick() {
    setOpen(false)
    setConfirmOpen(true)
  }

  function handleConfirm() {
    setConfirmOpen(false)
    onReturn()
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="text-ink-muted hover:text-ink hover:bg-surface inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          aria-label="More actions"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <EllipsisVertical size={16} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
            <button
              onClick={handleReturnClick}
              disabled={disabled}
              className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3 py-2.5 text-left text-[0.8125rem] font-medium text-ink transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 size={16} className="shrink-0 text-ink-dim" />
              <span>{isPending ? 'Returning...' : 'Return to queue'}</span>
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="mx-4 max-w-sm rounded-lg bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-ink text-[0.9375rem] font-semibold">
              Return ticket to queue?
            </h3>
            <p className="text-ink-muted mt-2 text-[0.8125rem] leading-relaxed">
              This will unassign you from the ticket and make it available to other
              agents.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-8 items-center rounded-lg border border-border bg-transparent px-3 text-[0.8125rem] font-medium text-ink transition-colors hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="inline-flex h-8 items-center rounded-lg bg-danger px-3 text-[0.8125rem] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? 'Returning...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
