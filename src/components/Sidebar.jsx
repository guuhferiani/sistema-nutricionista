import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const LogoIcon = () => (
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
      <path d="M50 85C50 85 15 65 15 35C15 20 25 15 35 15C42 15 47 18 50 22C53 18 58 15 65 15C75 15 85 20 85 35C85 65 50 85 50 85Z" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M42 55C42 55 45 42 50 42C55 42 58 55 58 70C58 70 54 75 50 75C46 75 42 70 42 70V55Z" fill="#10b981"/>
      <path d="M50 42V75" stroke="var(--sidebar-bg)" strokeWidth="2"/>
    </svg>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LogoIcon />
        <h1>Feriani <span>Nutri</span></h1>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="11" width="7" height="10"></rect><rect x="3" y="15" width="7" height="6"></rect></svg>
          <span>Dashboard</span>
        </Link>
        <Link to="/pacientes" className={`nav-item ${location.pathname.startsWith('/pacientes') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Pacientes</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Sair</span>
        </button>
      </div>

      {/* Item de Sair duplicado para o mobile bottom bar (será controlado via CSS) */}
      <div className="mobile-only-logout">
        <button onClick={handleLogout} className="nav-item logout-mobile-btn" style={{ border: 'none', background: 'transparent', width: '100%', color: '#fecaca' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
