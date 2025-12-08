import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClassification } from './classification-provider'

export function ClassificationPrimaryButtons() {
  const { setOpen } = useClassification()

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        onClick={() => setOpen('import')}
      >
        <Download size={16} />
        Importuj
      </Button>
      <Button onClick={() => setOpen('add')}>
        <Plus size={16} />
        Dodaj klasyfikację
      </Button>
    </div>
  )
}

