import { AuthProvider } from './context/AuthContext'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}
