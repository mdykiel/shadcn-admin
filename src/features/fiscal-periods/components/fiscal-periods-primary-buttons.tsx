import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useFiscalPeriods } from './fiscal-periods-provider'

export function FiscalPeriodsPrimaryButtons() {
  const { setOpen } = useFiscalPeriods()

  return (
    <Button onClick={() => setOpen('add')}>
      <Plus className='mr-2 h-4 w-4' />
      Dodaj okres
    </Button>
  )
}

