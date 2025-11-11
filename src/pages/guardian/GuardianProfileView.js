import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

// Define styles as a JavaScript object
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    textAlign: 'center',
    padding: '2rem'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  content: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '0 1.5rem',
    width: '100%'
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  profileImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  profileImagePlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    border: '4px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  profileName: {
    fontSize: '1.8rem',
    margin: '0.5rem 0',
    color: '#2c3e50'
  },
  profileId: {
    color: '#6c757d',
    margin: '0.25rem 0',
    fontSize: '0.9rem'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#2c3e50',
    fontSize: '1.5rem'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  },
  infoIcon: {
    marginRight: '1rem',
    color: '#3498db',
    marginTop: '0.25rem',
    flexShrink: 0
  },
  infoLabel: {
    fontSize: '0.8rem',
    color: '#6c757d',
    marginBottom: '0.25rem'
  },
  infoValue: {
    fontWeight: '500',
    color: '#2c3e50',
    wordBreak: 'break-word'
  }
};

// Add keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

const GuardianProfileView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const guardian = location.state?.guardian;

    if (!guardian) {
        return (
            <div style={styles.loadingContainer}>
                <p>No guardian data found. Please go back to dashboard.</p>
                <button
                    onClick={() => navigate('/guardian/home')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        marginTop: '10px',
                        cursor: 'pointer'
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Add back to home button */}
            <div style={{padding: '1rem', marginBottom: '1rem'}}>
                <button 
                    onClick={() => navigate('/guardian/home')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ← Back to Home
                </button>
            </div>
            <div style={styles.content}>
                <div style={styles.header}>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        marginBottom: '2rem'
                    }}>
                        {guardian.profile_picture_url ? (
                            <img 
                                src={guardian.profile_picture_url} 
                                alt={`${guardian.name || 'User'}'s profile`}
                                style={styles.profileImage}
                            />
                        ) : (
                            <div style={styles.profileImagePlaceholder}>
                                <FaUser size={48} color="#6c757d" />
                            </div>
                        )}
                        <h1 style={styles.profileName}>
                            {guardian.name || 'No Name'}
                        </h1>
                        <p style={styles.profileId}>
                            Guardian ID: {guardian.guardian_id || 'N/A'}
                        </p>
                    </div>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Personal Information</h2>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <FaEnvelope style={styles.infoIcon} />
                            <div>
                                <div style={styles.infoLabel}>Email</div>
                                <div style={styles.infoValue}>
                                    {guardian.email || 'Not provided'}
                                </div>
                            </div>
                        </div>

                        <div style={styles.infoItem}>
                            <FaPhone style={styles.infoIcon} />
                            <div>
                                <div style={styles.infoLabel}>Phone</div>
                                <div style={styles.infoValue}>
                                    {guardian.phone || 'Not provided'}
                                </div>
                            </div>
                        </div>

                        {guardian.address && (
                            <div style={styles.infoItem}>
                                <FaMapMarkerAlt style={styles.infoIcon} />
                                <div>
                                    <div style={styles.infoLabel}>Address</div>
                                    <div style={styles.infoValue}>
                                        {guardian.address}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardianProfileView;