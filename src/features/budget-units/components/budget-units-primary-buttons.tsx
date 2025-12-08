import { Building2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBudgetUnits } from './budget-units-provider'

export function BudgetUnitsPrimaryButtons() {
  const { setOpen } = useBudgetUnits()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('initialize')}
      >
        <span>Zainicjuj wzorcowy plan kont</span> <Settings size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Dodaj jednostkę</span> <Building2 size={18} />
      </Button>
    </div>
  )
}