import { useState } from 'react'
import GetDomain from './GetDomain'

export function SignIn({ OnLoginSuccess }) {
    const [Email, SetEmail] = useState('')
    const [Password, SetPassword] = useState('')
    const [Error, SetError] = useState(null)
    const [Loading, SetLoading] = useState(false)

    const HandleSignIn = async () => {
        SetLoading(true)
        SetError(null)

        try {
            const Response = await fetch(`${GetDomain()}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email, Password }),
            })

            const Data = await Response.json()

            if (!Response.ok || !Data.Token) {
                SetError(Data.Error || 'Login failed')
            } else {
                OnLoginSuccess([Data.Token, Data.Role]) // <- Pass token to parent
            }
        } catch {
            SetError('Network error')
        } finally {
            SetLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 mt-20">
            <h2 className="text-amber-400 text-2xl font-bold mb-6">Sign In</h2>

            {Error && <p className="text-red-500 mb-4">{Error}</p>}

            <input
                type="email"
                placeholder="Email"
                value={Email}
                onChange={e => SetEmail(e.target.value)}
                className="w-full mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
                type="password"
                placeholder="Password"
                value={Password}
                onChange={e => SetPassword(e.target.value)}
                className="w-full mb-6 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
                onClick={HandleSignIn}
                disabled={Loading}
                className="w-full bg-amber-500 text-black font-semibold py-3 rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
            >
                {Loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="mt-4 text-gray-400 text-center">
                Don't have an account?{' '}
                <button
                    className="text-amber-400 hover:underline"
                    onClick={() => {
                        document.location = '/register'
                    }}
                >
                    Register
                </button>
            </p>
        </div>
    )
}
