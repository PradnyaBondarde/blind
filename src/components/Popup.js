import React from 'react';
import '../styles/popup.css';

const Popup = ({ title, message, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup">
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default Popup;
