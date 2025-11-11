import React from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/form.css';

const BlindConnected = () => {
  const location = useLocation();
  const { blindId, guardianId } = location.state || {};

  return (
    <div className="form-container">
      <h2>Connected Successfully!</h2>
      <p>Your Blind ID: {blindId}</p>
      <p>Connected Guardian ID: {guardianId}</p>
    </div>
  );
};

export default BlindConnected;
