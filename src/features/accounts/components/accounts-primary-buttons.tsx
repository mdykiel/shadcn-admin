import { useAccounts } from './accounts-provider'
import { Button } from '@/components/ui/button'
import { Plus, TreePine, List } from 'lucide-react'
import { useSearch, useNavigate } from '@tanstack/react-router'

export function AccountsPrimaryButtons() {
  const { setOpen, setCurrentRow } = useAccounts()
  const search = useSearch({ from: '/_authenticated/accounts/' })
  const navigate = useNavigate({ from: '/_authenticated/accounts/' })

  const currentView = search.view || 'list'

  const toggleView = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        view: currentView === 'list' ? 'tree' : 'list',
      }),
    })
  }

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        onClick={toggleView}
        className='shrink-0'
      >
        {currentView === 'list' ? (
          <>
            <TreePine size={16} />
            Widok drzewa
          </>
        ) : (
          <>
            <List size={16} />
            Widok listy
          </>
        )}
      </Button>
      <Button
        onClick={() => {
          setCurrentRow(null)
          setOpen('add')
        }}
        className='shrink-0'
      >
        <Plus size={16} />
        Dodaj konto
      </Button>
    </div>
  )
}