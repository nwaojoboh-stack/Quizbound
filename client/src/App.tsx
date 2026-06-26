import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Room from './pages/Room'
import Presentation from './pages/Presentation'
import { Toaster } from './components/Toaster'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/present/:code" element={<Presentation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
