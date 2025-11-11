import React from 'react';
import '../styles/card.css';

const Card = ({ name, faceUrl, idUrl, status }) => {
  const isAccepted = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <div className="card">
      <h4>{name}</h4>
      <p>Face: {faceUrl ? 'Uploaded' : 'N/A'}</p>
      <p>ID: {idUrl ? 'Uploaded' : 'N/A'}</p>
      <div className={`status ${isAccepted ? 'accepted' : isRejected ? 'rejected' : ''}`}>
        {isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Pending'}
      </div>
    </div>
  );
};

export default Card;
