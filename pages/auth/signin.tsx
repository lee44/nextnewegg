import type { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { ClientSafeProvider, getCsrfToken, getProviders, getSession, signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Image from 'next/image'
import { errorMessage } from '../../types/errors'
import OauthButton from '../../components/ui/OAuthButton'
import CredentialForms from '../../components/common/authentication/CredentialForms'

type SignInProps = {
  providers: ClientSafeProvider
  error: string | string[] | null
  csrfToken: string
}

const SignIn = ({ providers, error, csrfToken }: SignInProps) => {
  // console.log(providers)

  return (
    <>
      <div className='flex items-center justify-center h-screen'>
        <div className='max-w-[400px] flex flex-col justify-center items-center gap-y-4 border-1 p-12 rounded-md bg-card-bg'>
          <Image src={'/icons/newegg.png'} alt='product' className='' width={135} height={115} priority />
          <h5 className=''>Sign In</h5>
          {error && <ErrorMessage message={error} />}
          <CredentialForms formType='Sign In' fields={['Email', 'Password']} csrfToken={csrfToken} />
          {Object.values(providers)
            .filter((provider) => provider.name !== 'Credentials')
            .map((provider) => (
              <div className='w-full' key={provider.name}>
                <OauthButton provider={provider} />
              </div>
            ))}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (session) {
    console.log('Redirecting to profile page')

    return { redirect: { destination: '/', permanent: false } }
  }

  // console.log('Context QUERY', context.query)

  const providers = await getProviders()

  return {
    props: {
      providers: Object.values(providers ?? {}),
      error: errorMessage(context?.query?.error) || null,
      csrfToken: (await getCsrfToken(context)) || null,
    },
  }
}

export default SignIn
