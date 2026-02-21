import { useEffect } from 'react'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Dashboard from './Pages/Dashboard'
import VehicleRegistry from './Pages/VehicleRegistry'
import TripDispatcher from './Pages/TripDispatcher'
import Maintenance from './Pages/Maintenance'
import ExpenseLogging from './Pages/ExpenseLogging'
import DriverPerformance from './Pages/DriverPerformance'
import Analytics from './Pages/Analytics'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

export default function App() {
  // Keep backend alive on Render by pinging health endpoint every 12 minutes
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Ping health endpoint on app load
    const pingHealth = async () => {
      try {
        await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      } catch (error) {
        console.log('Health check ping sent');
      }
    };

    // Initial ping
    pingHealth();

    // Set interval to ping every 12 minutes (720000ms)
    const interval = setInterval(() => {
      pingHealth();
    }, 720000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicle-registry" element={<VehicleRegistry />} />
        <Route path="/trip-dispatcher" element={<TripDispatcher />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/expense-logging" element={<ExpenseLogging />} />
        <Route path="/driver-performance" element={<DriverPerformance />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  )
}