import React from 'react'
import GetDomain from './GetDomain'

export function AccountManagement() {
    const HandleDeleteAccount = async () => {
        const Token = sessionStorage.getItem('Token')

        try {
            const Response = await fetch(`${GetDomain()}/delete-account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Token}`,
                },
            })

            if (!Response.ok) {
                const Data = await Response.json()
                alert(`Failed to delete account: ${Data.Error || Response.statusText}`)
                return
            }

            alert('Account deleted successfully. You will be logged out.')
            sessionStorage.removeItem('Token')
            window.location.href = '/logout'
        } catch (error) {
            alert('Error deleting account. Try again later.')
        }
    }

    const HandleLogout = () => {
        sessionStorage.removeItem('Token')
        window.location.href = '/logout'
    }

    return (
        <div className="pt-20">
            <h1 className="text-2xl font-bold mb-4">Account Management</h1>
            <div className="space-y-4">
                <h1>Account Role: {sessionStorage.getItem('UserRole') || 'User'}</h1>
                <button
                    className="text-xl text-red-500 font-extrabold cursor-pointer px-4 py-2 border border-red-500 rounded hover:bg-red-600 hover:text-white transition"
                    onClick={HandleDeleteAccount}
                    type="button"
                >
                    Delete Account
                </button>
                <br></br>
                <button
                    className="text-xl text-red-500 font-extrabold cursor-pointer px-4 py-2 border border-red-500 rounded hover:bg-red-600 hover:text-white transition"
                    onClick={HandleLogout}
                    type="button"
                >
                    Logout
                </button>
            </div>
        </div>
    )
}
