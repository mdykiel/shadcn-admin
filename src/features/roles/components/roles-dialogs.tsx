import { useRoles } from './roles-provider'
import { RolesMutateDialog } from './roles-mutate-dialog'
import { RolesDeleteDialog } from './roles-delete-dialog'

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()

  return (
    <>
      <RolesMutateDialog
        key='role-add'
        open={open === 'add'}
        onOpenChange={(state) => {
          setOpen(state ? 'add' : null)
          if (!state) setCurrentRow(null)
        }}
      />

      {currentRow && (
        <>
          <RolesMutateDialog
            key={`role-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setCurrentRow(null)
            }}
            currentRow={currentRow}
          />

          <RolesDeleteDialog
            key={`role-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={(state) => {
              setOpen(state ? 'delete' : null)
              if (!state) setCurrentRow(null)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}

