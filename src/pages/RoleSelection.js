import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/form.css';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="form-container">
      <h1>Welcome to Blind–Guardian System</h1>
      <p className="desc">Select your role to continue:</p>
      <div className="btn-group">
        <button onClick={() => navigate('/blind/signup')}>Blind User</button>
        <button onClick={() => navigate('/guardian/signup')}>Guardian</button>
      </div>
    </div>
  );
};

export default RoleSelection;
