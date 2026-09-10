import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FoodLog from './pages/FoodLog.jsx';
import Water from './pages/Water.jsx';
import Workouts from './pages/Workouts.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/food" element={<FoodLog />} />
        <Route path="/water" element={<Water />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <NavBar />
    </div>
  );
}
