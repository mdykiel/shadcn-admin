import { usePlans } from './plans-provider'
import { PlanMutateDrawer } from './plan-mutate-drawer'
import { PlansDeleteDialog } from './plans-delete-dialog'
import { PlanViewSheet } from './plan-view-sheet'

interface Props {
  onSuccess?: () => void
}

export function PlansDialogs({ onSuccess }: Props) {
  const { open, setOpen, currentPlan, setCurrentPlan } = usePlans()

  const handleClose = () => {
    setOpen(null)
    setCurrentPlan(null)
  }

  const handleSuccess = () => {
    handleClose()
    onSuccess?.()
  }

  return (
    <>
      <PlanMutateDrawer
        open={open === 'add' || open === 'edit'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        currentRow={open === 'edit' ? currentPlan : null}
        onSuccess={handleSuccess}
      />
      <PlansDeleteDialog
        open={open === 'delete'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        plan={currentPlan}
        onSuccess={handleSuccess}
      />
      <PlanViewSheet
        open={open === 'view'}
        onOpenChange={(isOpen) => !isOpen && handleClose()}
        plan={currentPlan}
        onSuccess={onSuccess}
      />
    </>
  )
}
