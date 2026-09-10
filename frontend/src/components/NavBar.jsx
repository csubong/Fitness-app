import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Dashboard', icon: '\u{1F4CA}', end: true },
  { to: '/food', label: 'Food', icon: '\u{1F37D}️' },
  { to: '/water', label: 'Water', icon: '\u{1F4A7}' },
  { to: '/workouts', label: 'Workouts', icon: '\u{1F3CB}️' },
  { to: '/history', label: 'History', icon: '\u{1F5D3}️' },
];

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
