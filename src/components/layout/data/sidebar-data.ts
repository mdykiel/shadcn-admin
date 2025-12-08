import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Building2,
  Calculator,
  BookOpen,
  Receipt,
  ClipboardList,
  FileBarChart,
  TrendingUp,
  DollarSign,
  Calendar,
  Archive,
  CalendarRange,
} from 'lucide-react'
import { ClerkLogo } from '@/assets/clerk-logo'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: Package,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Secured by Clerk',
          icon: ClerkLogo,
          items: [
            {
              title: 'Sign In',
              url: '/clerk/sign-in',
            },
            {
              title: 'Sign Up',
              url: '/clerk/sign-up',
            },
            {
              title: 'User Management',
              url: '/clerk/user-management',
            },
          ],
        },
      ],
    },
    {
      title: 'Ustawienia',
      items: [
        {
          title: 'Jednostki budżetowe',
          url: '/units',
          icon: Building2,
        },
        {
          title: 'Okresy obrachunkowe',
          url: '/fiscal-periods',
          icon: CalendarRange,
        },
        {
          title: 'Dzienniki',
          url: '/journals',
          icon: ClipboardList,
        },
        {
          title: 'Plan kont',
          url: '/accounts',
          icon: BookOpen,
        },
        {
          title: 'Klasyfikacja budżetowa',
          url: '/classification',
          icon: Archive,
        },
      ],
    },
    {
      title: 'Planowanie',
      items: [
        {
          title: 'Plany finansowe',
          url: '/plans',
          icon: Calendar,
        },
        {
          title: 'Preliminarze',
          url: '/preliminaries',
          icon: TrendingUp,
        },
      ],
    },
    {
      title: 'Księgowość',
      items: [
        {
          title: 'Dokumenty',
          url: '/documents',
          icon: Receipt,
        },
        {
          title: 'Dziennik księgowań',
          url: '/operations',
          icon: ClipboardList,
        },
        {
          title: 'Zestawienie obrotów i sald',
          url: '/reports/trial-balance',
          icon: Calculator,
        },
      ],
    },
    {
      title: 'Realizacja',
      items: [
        {
          title: 'Sprawozdania budżetowe',
          icon: FileBarChart,
          items: [
            {
              title: 'Rb-27S',
              url: '/reports/rb27s',
            },
            {
              title: 'Rb-28S',
              url: '/reports/rb28s',
            },
          ],
        },
        {
          title: 'Sprawozdania finansowe',
          icon: DollarSign,
          items: [
            {
              title: 'Bilans',
              url: '/reports/balance-sheet',
            },
            {
              title: 'Rachunek zysków i strat',
              url: '/reports/income-statement',
            },
          ],
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
