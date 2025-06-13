import { useState } from 'react'
import GetDomain from './GetDomain'

export function Register({ OnRegisterSuccess }) {
    const [Username, SetUsername] = useState('')
    const [Email, SetEmail] = useState('')
    const [Password, SetPassword] = useState('')
    const [Error, SetError] = useState(null)
    const [Loading, SetLoading] = useState(false)

    const HandleRegister = async () => {
        SetLoading(true)
        SetError(null)

        try {
            const Response = await fetch(`${GetDomain()}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Email, Password, Username }),
            })

            const Data = await Response.json()

            if (!Response.ok || !Data.Token) {
                SetError(Data.Error || 'Registration failed')
            } else {
                OnRegisterSuccess([Data.Token, Data.Role]) // <- Pass token to parent
            }
        } catch {
            SetError('Network error')
        } finally {
            SetLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 mt-20">
            <h2 className="text-amber-400 text-2xl font-bold mb-6">Register</h2>

            {Error && <p className="text-red-500 mb-4">{Error}</p>}

            <input
                type="text"
                placeholder="Username"
                value={Username}
                onChange={e => SetUsername(e.target.value)}
                className="w-full mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
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
                onClick={HandleRegister}
                disabled={Loading}
                className="w-full bg-amber-500 text-black font-semibold py-3 rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
            >
                {Loading ? 'Registering...' : 'Register'}
            </button>

            <p className="mt-4 text-gray-400 text-center">
                Already have an account?{' '}
                <button
                    className="text-amber-400 hover:underline"
                    onClick={() => {
                        document.location = '/signin'
                    }}
                >
                    Sign In
                </button>
            </p>
        </div>
    )
}
