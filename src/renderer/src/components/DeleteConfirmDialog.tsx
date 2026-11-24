import React from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Trash, WarningCircle } from '@phosphor-icons/react'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Hapus Permanen',
  cancelLabel = 'Batal',
  onConfirm
}) => {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-paper-card border border-paper-border rounded-2xl p-6 shadow-2xl z-50 focus:outline-none select-none">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <WarningCircle size={22} weight="bold" />
            </div>

            <div className="flex-1">
              <AlertDialog.Title className="font-heading text-lg font-semibold text-ink-primary">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-ink-secondary leading-relaxed font-body">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-ink-secondary bg-transparent hover:bg-paper-hover rounded-lg transition-colors border border-paper-border"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-lg transition-all shadow-sm"
              >
                <Trash size={16} weight="bold" />
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
