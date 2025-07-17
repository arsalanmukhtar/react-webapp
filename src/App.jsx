import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import MapDashboard from './components/MapDashboard/MapDashboard.jsx'
import Navbar from './components/Navbar/Navbar.jsx'

import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'

import Homepage from './components/Homepage/Homepage.jsx'; // Import Homepage
import UserPanelSettings from './components/UserPanelSettings/UserPanelSettings.jsx'; // Import UserPanelSettings

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './contexts/PrivateRoute';

const App = () => (
  <BrowserRouter>
    {/* Wrap the entire application with AuthProvider */}
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Public Homepage Route - set as default */}
        <Route path="/" element={<Homepage />} />

        {/* Protected Routes */}
        <Route
          path="/map-dashboard"
          element={
            <PrivateRoute>
              <MapDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/user-panel"
          element={
            <PrivateRoute>
              <UserPanelSettings />
            </PrivateRoute>
          }
        />

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} ></Route>
        <Route path="/reset-password" element={<ResetPassword />} ></Route>

        {/* ...other routes */}
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

export default App
