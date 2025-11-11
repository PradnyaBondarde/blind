import React from 'react';
import '../styles/navbar.css';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ userType }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="navbar">
      <h1>{userType === 'guardian' ? 'Guardian Dashboard' : 'Blind Portal'}</h1>
      <div className="nav-links">
        <a href="/">Home</a>
        <a href="/guardian/home">Dashboard</a>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Navbar;
