import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import MapContainer from './components/MapContainer/MapContainer.jsx'
import Navbar from './components/Navbar/Navbar.jsx'

import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import ForgotPassword from './components/Auth/ForgotPassword'

const App = () => (
  <BrowserRouter>
    <Navbar />
    <Routes>
      {/* Add your routes here */}
      <Route path="/webgis" element={<MapContainer />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} ></Route>
      {/* ...other routes */}
    </Routes>
  </BrowserRouter>
)

export default App