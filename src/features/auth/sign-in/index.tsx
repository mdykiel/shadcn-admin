import { Link, useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Zaloguj się</CardTitle>
          <CardDescription>
            Wprowadź email i hasło aby się zalogować
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter className='flex flex-col gap-4'>
          <p className='text-muted-foreground text-center text-sm'>
            Nie masz jeszcze konta?{' '}
            <Link
              to='/sign-up'
              className='text-primary hover:underline underline-offset-4 font-medium'
            >
              Zarejestruj się
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
