import { login, signup } from './actions'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
            <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
                <h1 className="text-3xl font-bold mb-6 text-center">Nova Chat</h1>

                {searchParams.message && (
                    <div className="bg-red-100 text-red-900 px-4 py-2 rounded mb-4 text-center border border-red-200 text-sm">
                        {searchParams.message}
                    </div>
                )}

                <label className="text-md" htmlFor="email">
                    Email
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    name="email"
                    placeholder="you@example.com"
                    required
                />

                <label className="text-md" htmlFor="password">
                    Password
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />

                <button
                    formAction={login}
                    className="bg-blue-600 rounded-md px-4 py-2 text-foreground mb-2 hover:bg-blue-700 transition-colors"
                >
                    Sign In
                </button>
                <button
                    formAction={signup}
                    className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2 hover:bg-foreground/5 transition-colors"
                >
                    Sign Up
                </button>

            </form>
        </div>
    )
}
