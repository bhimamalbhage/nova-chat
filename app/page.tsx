import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-white dark:bg-black text-black dark:text-white">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold mb-4">
          Welcome to Nova Chat
        </h1>

        <p className="max-w-xl text-lg text-gray-600 dark:text-gray-300 mb-8">
          A demonstration of Next.js 15 + Supabase Auth
        </p>

        {user ? (
          <div className="flex flex-col items-center gap-4 p-6 border rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <p className="text-xl font-medium">✨ Logged in as <span className="text-blue-500">{user.email}</span></p>
            <form action={signOut}>
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-xl mb-6">You are currently logged out.</p>
            <Link href="/login" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-500/20">
              Go to Login Page
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
