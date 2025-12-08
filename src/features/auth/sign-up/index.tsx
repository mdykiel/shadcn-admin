import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Utwórz konto
          </CardTitle>
          <CardDescription>
            Wprowadź swoje dane aby utworzyć nowe konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter className='flex flex-col gap-4'>
          <p className='text-muted-foreground text-center text-sm'>
            Masz już konto?{' '}
            <Link
              to='/sign-in'
              className='text-primary hover:underline underline-offset-4 font-medium'
            >
              Zaloguj się
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
