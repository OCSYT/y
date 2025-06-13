import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import './App.css'
import { AccountManagement } from './Modules/AccountManagement'
import { Sidebar, NavItems, TopBar } from './Modules/Navigation'
import Posts from './Modules/Posts'
import { Register } from './Modules/Register'
import { SignIn } from './Modules/SignIn'
import Logout from './Modules/Logout'

function App() {
  const [IsSidebarOpen, SetIsSidebarOpen] = useState(false)

  const Token = sessionStorage.getItem('Token')
  const HandleLogin = (Data) => {
    sessionStorage.setItem('Token', Data[0])
    sessionStorage.setItem('UserRole', Data[1])
    window.location.href = '/'
  }

  const HandleLogout = () => {
    sessionStorage.clear()
    window.location.href = '/signin'
  }

  const ToggleSidebar = () => SetIsSidebarOpen((prev) => !prev)
  const CloseSidebar = () => SetIsSidebarOpen(false)

  const RequireAuth = ({ children }) => {
    return Token ? children : <Navigate to="/signin" replace />
  }

  const RedirectIfAuth = ({ children }) => {
    return Token ? <Navigate to="/" replace /> : children
  }

  // Layout wrapper for main authenticated pages
  const AuthLayout = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 relative flex flex-col md:flex-row">
      <TopBar ToggleSidebar={ToggleSidebar} />

      {/* Sidebar drawer for small screens */}
      <Sidebar
        IsSidebarOpen={IsSidebarOpen}
        CloseSidebar={CloseSidebar}
        NavItems={<NavItems />}
        className="fixed inset-0 z-30 md:static md:translate-x-0 transition-transform duration-300 ease-in-out bg-gray-900 md:bg-transparent"
      />

      {/* Overlay when sidebar is open on small screens */}
      {IsSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
          onClick={CloseSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main content container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full p-4 md:p-6">
        {/* Sidebar for md+ screens */}
        <aside className="hidden md:block w-1/5 pr-6">
          <nav className="space-y-6">
            <div className="text-3xl font-extrabold text-amber-400 mb-4">Y</div>
            <ul className="space-y-2">
              <NavItems />
            </ul>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 max-w-full md:max-w-2xl mx-auto pt-6">{children}</main>
      </div>
    </div>
  )

  return (
    <Router>
      <Routes>
        <Route
          path="/register"
          element={
            <RedirectIfAuth>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 relative p-4">
                <Register OnRegisterSuccess={HandleLogin} />
              </div>
            </RedirectIfAuth>
          }
        />
        <Route
          path="/signin"
          element={
            <RedirectIfAuth>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 relative p-4">
                <SignIn OnLoginSuccess={HandleLogin} />
              </div>
            </RedirectIfAuth>
          }
        />
        <Route
          path="/logout"
          element={
            <RequireAuth>
              <Logout OnLogout={HandleLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AuthLayout>
                <AccountManagement />
              </AuthLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AuthLayout>
                <Posts />
              </AuthLayout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
