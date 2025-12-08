import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Journals } from '@/features/journals'

const searchSchema = z.object({
  type: z.enum(['BUDZET', 'WRD', 'ZFSS', 'INNY']).optional(),
  name: z.string().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
})

export const Route = createFileRoute('/_authenticated/journals/')({
  validateSearch: searchSchema,
  component: JournalsPage,
})

function JournalsPage() {
  const search = Route.useSearch()

  return (
    <Journals
      search={search}
      navigate={Route.useNavigate()}
    />
  )
}

