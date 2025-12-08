import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Account, AccountType } from '@/types/auth'
import { useAccounts } from './accounts-provider'
import { DataTableRowActions } from './data-table-row-actions'

const accountTypeLabels: Record<AccountType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'BILANSOWE_AKTYWNE': { label: 'Bil. Aktywa', variant: 'default' },
  'BILANSOWE_PASYWNE': { label: 'Bil. Pasywa', variant: 'secondary' },
  'BILANSOWE_AKTYWNO_PASYWNE': { label: 'Bil. Akt-Pas', variant: 'outline' },
  'WYNIKOWE_KOSZTOWE': { label: 'Wyn. Koszty', variant: 'destructive' },
  'WYNIKOWE_PRZYCHODOWE': { label: 'Wyn. Przychody', variant: 'default' },
  'POZABILANSOWE': { label: 'Pozabilansowe', variant: 'outline' },
  'ROZLICZENIOWE': { label: 'Rozliczeniowe', variant: 'secondary' },
}

interface AccountTreeNodeProps {
  account: Account
  level: number
}

function AccountTreeNode({ account, level }: AccountTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = account.children && account.children.length > 0

  const typeConfig = accountTypeLabels[account.accountType]

  return (
    <div className='w-full'>
      <div
        className='flex items-center gap-2 p-2 hover:bg-muted/50 rounded'
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren ? (
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
        ) : (
          <div className='w-6' />
        )}

        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <span className='font-mono text-sm text-muted-foreground min-w-20'>
            {account.number}
          </span>
          <span className={`flex-1 ${!account.isActive ? 'text-muted-foreground line-through' : ''}`}>
            {account.name}
          </span>
          {!account.isActive && (
            <Badge variant='outline' className='text-xs'>
              Nieaktywne
            </Badge>
          )}
          <Badge variant='outline' className='font-mono text-xs'>
            {account.zespol}
          </Badge>
          <Badge variant={typeConfig.variant} className='text-xs'>
            {typeConfig.label}
          </Badge>
          <Badge variant={account.normalBalance === 'DEBIT' ? 'default' : 'secondary'} className='text-xs'>
            {account.normalBalance === 'DEBIT' ? 'Wn' : 'Ma'}
          </Badge>
        </div>

        <DataTableRowActions row={{ original: account } as any} />
      </div>

      {hasChildren && isExpanded && (
        <div>
          {account.children!.map((child) => (
            <AccountTreeNode
              key={child.id}
              account={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface AccountsTreeViewProps {
  accounts: Account[]
  isLoading: boolean
}

export function AccountsTreeView({ accounts, isLoading }: AccountsTreeViewProps) {
  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <p>Ładowanie drzewa kont...</p>
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold'>Brak kont księgowych</h3>
          <p className='text-muted-foreground'>
            Użyj przycisku "Dodaj konto" aby utworzyć pierwsze konto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='border rounded-md bg-background'>
      <div className='p-4'>
        <h3 className='font-semibold mb-4'>Hierarchiczny plan kont</h3>
        <div className='space-y-1'>
          {accounts.map((account) => (
            <AccountTreeNode
              key={account.id}
              account={account}
              level={0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}