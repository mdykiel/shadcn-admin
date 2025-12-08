import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useJournals } from './journals-provider'

export function JournalsPrimaryButtons() {
  const { setOpen } = useJournals()

  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Dodaj dziennik</span> <Plus className='h-4 w-4' />
      </Button>
    </div>
  )
}

