import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FiArrowLeft, FiUser, FiClock, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

const ConnectedUsers = () => {
    const navigate = useNavigate();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchConnectedUsers();
    }, []);

    const fetchConnectedUsers = async () => {
        try {
            setLoading(true);
            
            // Get current guardian's ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Not authenticated');
            }

            // Get guardian_id from guardians table
            const { data: guardianData, error: guardianError } = await supabase
                .from('guardians')
                .select('guardian_id')
                .eq('email', user.email)
                .single();

            if (guardianError || !guardianData) {
                throw new Error('Guardian profile not found');
            }

            // Get all accepted connections with blind user details
            const { data, error: connectionsError } = await supabase
                .from('connections')
                .select(`
                    *,
                    blind_user:blind_id (
                        name,
                        age,
                        gender,
                        phone_number,
                        email,
                        address,
                        created_at
                    )
                `)
                .eq('guardian_id', guardianData.guardian_id)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });

            if (connectionsError) throw connectionsError;

            setConnections(data || []);
        } catch (err) {
            console.error('Error fetching connected users:', err);
            setError(err.message || 'Failed to load connected users');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveConnection = async (connectionId) => {
        if (!window.confirm('Are you sure you want to remove this connection? The user will need to send a new connection request.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('connections')
                .update({ 
                    status: 'removed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', connectionId);

            if (error) throw error;

            // Refresh the list
            fetchConnectedUsers();
            alert('Connection removed successfully');
        } catch (err) {
            console.error('Error removing connection:', err);
            alert('Failed to remove connection: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}>Loading connected users...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorText}>{error}</div>
                <button 
                    onClick={() => navigate('/guardian/home')}
                    style={styles.backButton}
                >
                    <FiArrowLeft style={{ marginRight: '8px' }} />
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button 
                    onClick={() => navigate('/guardian/home')}
                    style={styles.backButton}
                >
                    <FiArrowLeft style={{ marginRight: '8px' }} />
                    Back to Dashboard
                </button>
                <h1 style={styles.title}>Connected Users</h1>
                <div style={{ width: '100px' }}></div> {/* For alignment */}
            </div>

            {connections.length === 0 ? (
                <div style={styles.emptyState}>
                    <FiUser size={48} style={styles.emptyIcon} />
                    <h2>No Connected Users</h2>
                    <p>You don't have any connected users yet. Connection requests will appear here once accepted.</p>
                </div>
            ) : (
                <div style={styles.connectionsGrid}>
                    {connections.map((connection) => (
                        <div key={connection.id} style={styles.connectionCard}>
                            <div style={styles.connectionHeader}>
                                <div style={styles.avatar}>
                                    {connection.blind_user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 style={styles.connectionName}>{connection.blind_user?.name || 'Unknown User'}</h3>
                                    <div style={styles.connectionMeta}>
                                        <span style={styles.connectionId}>ID: {connection.blind_id}</span>
                                        <span style={styles.connectionDate}>
                                            Connected on {new Date(connection.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.connectionDetails}>
                                <div style={styles.detailItem}>
                                    <FiUser style={styles.detailIcon} />
                                    <div>
                                        <div style={styles.detailLabel}>Age</div>
                                        <div>{connection.blind_user?.age || 'Not provided'}</div>
                                    </div>
                                </div>
                                <div style={styles.detailItem}>
                                    <FiPhone style={styles.detailIcon} />
                                    <div>
                                        <div style={styles.detailLabel}>Phone</div>
                                        <div>{connection.blind_user?.phone_number || 'Not provided'}</div>
                                    </div>
                                </div>
                                <div style={styles.detailItem}>
                                    <FiMail style={styles.detailIcon} />
                                    <div>
                                        <div style={styles.detailLabel}>Email</div>
                                        <div>{connection.blind_user?.email || 'Not provided'}</div>
                                    </div>
                                </div>
                                {connection.blind_user?.address && (
                                    <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
                                        <FiMapPin style={styles.detailIcon} />
                                        <div>
                                            <div style={styles.detailLabel}>Address</div>
                                            <div>{connection.blind_user.address}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={styles.connectionActions}>
                                <button
                                    style={styles.removeButton}
                                    onClick={() => handleRemoveConnection(connection.id)}
                                >
                                    Remove Connection
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: '700',
        color: '#1f2937',
        margin: 0,
        textAlign: 'center',
        flex: 1
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'transparent',
        border: '1px solid #d1d5db',
        color: '#4b5563',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        '&:hover': {
            backgroundColor: '#f3f4f6'
        }
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        margin: '0 auto'
    },
    emptyIcon: {
        color: '#9ca3af',
        marginBottom: '1rem'
    },
    connectionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem'
    },
    connectionCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    connectionHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center'
    },
    avatar: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#e0e7ff',
        color: '#4f46e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: '600',
        marginRight: '1rem',
        flexShrink: 0
    },
    connectionName: {
        margin: '0 0 0.25rem 0',
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827'
    },
    connectionMeta: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    connectionId: {
        fontSize: '0.875rem',
        color: '#6b7280'
    },
    connectionDate: {
        fontSize: '0.8rem',
        color: '#9ca3af'
    },
    connectionDetails: {
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem'
    },
    detailItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
    },
    detailIcon: {
        color: '#6b7280',
        marginTop: '0.25rem',
        flexShrink: 0
    },
    detailLabel: {
        fontSize: '0.75rem',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.25rem'
    },
    connectionActions: {
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        marginTop: 'auto'
    },
    removeButton: {
        width: '100%',
        backgroundColor: 'transparent',
        color: '#ef4444',
        border: '1px solid #ef4444',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontSize: '0.95rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
            backgroundColor: '#fef2f2'
        }
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
    },
    loader: {
        fontSize: '1.1rem',
        color: '#4b5563'
    },
    errorContainer: {
        padding: '2rem',
        textAlign: 'center'
    },
    errorText: {
        color: '#ef4444',
        marginBottom: '1.5rem',
        fontSize: '1.1rem'
    }
};

export default ConnectedUsers;