import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { BudgetClassification, ClassificationType } from '@/types/auth'
import { DataTableRowActions } from './data-table-row-actions'

const classificationTypeLabels: Record<ClassificationType, string> = {
  DOCHOD: 'Dochód',
  WYDATEK: 'Wydatek',
  PRZYCHOD: 'Przychód',
  ROZCHOD: 'Rozchód',
}

const classificationTypeColors: Record<ClassificationType, string> = {
  DOCHOD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  WYDATEK: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  PRZYCHOD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ROZCHOD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
}

// Nazwy działów wg rozporządzenia
export const dzialNames: Record<string, string> = {
  '010': 'Rolnictwo i łowiectwo',
  '020': 'Leśnictwo',
  '050': 'Rybołówstwo i rybactwo',
  '100': 'Górnictwo i kopalnictwo',
  '150': 'Przetwórstwo przemysłowe',
  '400': 'Wytwarzanie i zaopatrywanie w energię elektryczną, gaz i wodę',
  '500': 'Handel',
  '550': 'Hotele i restauracje',
  '600': 'Transport i łączność',
  '630': 'Turystyka',
  '700': 'Gospodarka mieszkaniowa',
  '710': 'Działalność usługowa',
  '720': 'Informatyka',
  '750': 'Administracja publiczna',
  '751': 'Urzędy naczelnych organów władzy państwowej',
  '752': 'Obrona narodowa',
  '753': 'Obowiązkowe ubezpieczenia społeczne',
  '754': 'Bezpieczeństwo publiczne i ochrona przeciwpożarowa',
  '755': 'Wymiar sprawiedliwości',
  '756': 'Dochody od osób prawnych, od osób fizycznych i od innych jednostek',
  '757': 'Obsługa długu publicznego',
  '758': 'Różne rozliczenia',
  '801': 'Oświata i wychowanie',
  '803': 'Szkolnictwo wyższe i nauka',
  '851': 'Ochrona zdrowia',
  '852': 'Pomoc społeczna',
  '853': 'Pozostałe zadania w zakresie polityki społecznej',
  '854': 'Edukacyjna opieka wychowawcza',
  '855': 'Rodzina',
  '900': 'Gospodarka komunalna i ochrona środowiska',
  '921': 'Kultura i ochrona dziedzictwa narodowego',
  '925': 'Ogrody botaniczne i zoologiczne oraz naturalne obszary i obiekty chronionej przyrody',
  '926': 'Kultura fizyczna',
}

// Nazwy rozdziałów wg rozporządzenia (najważniejsze dla szkoły)
export const rozdzialNames: Record<string, string> = {
  '80101': 'Szkoły podstawowe',
  '80102': 'Szkoły podstawowe specjalne',
  '80103': 'Oddziały przedszkolne w szkołach podstawowych',
  '80104': 'Przedszkola',
  '80105': 'Przedszkola specjalne',
  '80106': 'Inne formy wychowania przedszkolnego',
  '80107': 'Świetlice szkolne',
  '80110': 'Gimnazja',
  '80111': 'Gimnazja specjalne',
  '80113': 'Dowożenie uczniów do szkół',
  '80114': 'Zespoły obsługi ekonomiczno-administracyjnej szkół',
  '80115': 'Technika',
  '80116': 'Technika specjalne',
  '80117': 'Branżowe szkoły I i II stopnia',
  '80120': 'Licea ogólnokształcące',
  '80121': 'Licea ogólnokształcące specjalne',
  '80130': 'Szkoły zawodowe',
  '80131': 'Kwalifikacyjne kursy zawodowe',
  '80132': 'Szkoły artystyczne',
  '80140': 'Centra kształcenia ustawicznego i praktycznego',
  '80142': 'Ośrodki szkolenia, dokształcania i doskonalenia kadr',
  '80144': 'Inne formy kształcenia osobno niewymienione',
  '80146': 'Dokształcanie i doskonalenie nauczycieli',
  '80148': 'Stołówki szkolne i przedszkolne',
  '80149': 'Realizacja zadań wymagających stosowania specjalnej organizacji nauki',
  '80150': 'Realizacja zadań wymagających stosowania specjalnej organizacji nauki i metod pracy dla dzieci i młodzieży w szkołach podstawowych',
  '80151': 'Kształcenie ustawiczne dorosłych',
  '80152': 'Realizacja zadań wymagających stosowania specjalnej organizacji nauki i metod pracy dla dzieci i młodzieży w gimnazjach i klasach dotychczasowego gimnazjum',
  '80153': 'Zapewnienie uczniom prawa do bezpłatnego dostępu do podręczników',
  '80154': 'Edukacja dzieci cudzoziemców',
  '80155': 'Realizacja zadań wymagających stosowania specjalnej organizacji nauki i metod pracy dla dzieci i młodzieży w szkołach ponadpodstawowych',
  '80195': 'Pozostała działalność',
}

export const classificationColumns: ColumnDef<BudgetClassification>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Zaznacz wszystkie'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Zaznacz wiersz'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: 'w-[40px]',
    },
  },
  {
    accessorKey: 'dzial',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Dział' />
    ),
    cell: ({ row }) => {
      const dzial = row.getValue('dzial') as string
      const dzialName = dzialNames[dzial] || ''
      return (
        <div className='flex flex-col gap-0.5'>
          <span className='font-mono font-semibold text-primary'>{dzial}</span>
          {dzialName && (
            <span className='text-xs text-muted-foreground leading-tight'>{dzialName}</span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[180px]',
    },
  },
  {
    accessorKey: 'rozdzial',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Rozdział' />
    ),
    cell: ({ row }) => {
      const rozdzial = row.getValue('rozdzial') as string
      const rozdzialName = rozdzialNames[rozdzial] || ''
      return (
        <div className='flex flex-col gap-0.5'>
          <span className='font-mono font-semibold text-primary'>{rozdzial}</span>
          {rozdzialName && (
            <span className='text-xs text-muted-foreground leading-tight'>{rozdzialName}</span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[200px]',
    },
  },
  {
    accessorKey: 'paragraf',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Paragraf' />
    ),
    cell: ({ row }) => {
      const paragraf = row.getValue('paragraf') as string
      const name = row.original.name
      return (
        <div className='flex flex-col gap-0.5'>
          <span className='font-mono font-semibold text-primary'>{paragraf}</span>
          <span className='text-xs text-muted-foreground leading-tight line-clamp-2'>{name}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const name = row.original.name
      return name.toLowerCase().includes(value.toLowerCase())
    },
    meta: {
      className: 'min-w-[250px]',
    },
  },
  {
    accessorKey: 'podparagraf',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Podparagraf' />
    ),
    cell: ({ row }) => {
      const podparagraf = row.getValue('podparagraf') as string | undefined
      return podparagraf ? (
        <span className='font-mono font-semibold text-primary'>{podparagraf}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Typ' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as ClassificationType
      return (
        <Badge variant='outline' className={classificationTypeColors[type]}>
          {classificationTypeLabels[type]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Aktywna' : 'Nieaktywna'}
        </Badge>
      )
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    meta: {
      className: 'w-[60px]',
    },
  },
]

