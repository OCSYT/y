import { useEffect } from 'react'

function Logout({ OnLogout }) {
    useEffect(() => {
        OnLogout()
    }, [OnLogout])

    return (
        <div className="min-h-screen flex items-center justify-center text-white bg-black">
            <p>Logging out...</p>
        </div>
    )
}

export default Logout
