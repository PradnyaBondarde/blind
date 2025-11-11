import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FiArrowLeft, FiUser, FiClock, FiCheck, FiX } from 'react-icons/fi';

const ConnectionRequest = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchRequestDetails();
    }, [requestId]);

    // Update the fetchRequestDetails function
    const fetchRequestDetails = async () => {
        try {
            setLoading(true);

            // Get current guardian's ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Not authenticated');
            }

            // Get the specific connection with blind user details
            const { data, error: requestError } = await supabase
                .from('connections')
                .select(`
        id,
        blind_id,
        guardian_id,
        status,
        created_at,
        blind_user:blind_id (
          name,
          age,
          gender,
          phone_number,
          email,
          address
        )
      `)
                .eq('id', requestId)
                .single();

            if (requestError) throw requestError;
            if (!data) throw new Error('Request not found');

            // Verify the request belongs to the current guardian
            const { data: guardianData } = await supabase
                .from('guardians')
                .select('guardian_id')
                .eq('email', user.email)
                .single();

            if (guardianData.guardian_id !== data.guardian_id) {
                throw new Error('Unauthorized access to this request');
            }

            setRequest(data);
        } catch (err) {
            console.error('Error fetching request:', err);
            setError(err.message || 'Failed to load request details');
        } finally {
            setLoading(false);
        }
    };
    // Replace the existing handleStatusUpdate function with this
    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this connection request?`)) {
            return;
        }

        try {
            setUpdating(true);

            // 1) Update the connection status
            const { error: connUpdateError } = await supabase
                .from('connections')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (connUpdateError) throw connUpdateError;

            // 2) If accepted, update the blind_user's guardian_id (use blind_id column)
            if (newStatus === 'accepted') {
                const { error: blindUpdateError } = await supabase
                    .from('blind_users')
                    .update({
                        guardian_id: request.guardian_id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('blind_id', request.blind_id);

                if (blindUpdateError) throw blindUpdateError;
            }

            // Success
            alert(`Request ${newStatus} successfully!`);
            navigate('/guardian/home');

        } catch (err) {
            console.error('Error updating request status:', err);
            setError(err.message || 'Failed to update request status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}>Loading request details...</div>
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

    if (!request) {
        return (
            <div style={styles.container}>
                <h2>Request Not Found</h2>
                <p>The requested connection could not be found.</p>
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
                    onClick={() => navigate(-1)}
                    style={styles.backButton}
                >
                    <FiArrowLeft style={{ marginRight: '8px' }} />
                    Back
                </button>
                <h1 style={styles.title}>Connection Request</h1>
                <div style={{ width: '100px' }}></div> {/* For alignment */}
            </div>

            <div style={styles.card}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        {request.blind_user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h2 style={styles.userName}>{request.blind_user?.name || 'Unknown User'}</h2>
                        <p style={styles.userId}>ID: {request.blind_id}</p>
                        <div style={styles.statusBadge(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                    </div>
                </div>

                <div style={styles.detailsSection}>
                    <h3 style={styles.sectionTitle}>User Details</h3>
                    <div style={styles.detailsGrid}>
                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Age</span>
                            <span>{request.blind_user?.age || 'Not provided'}</span>
                        </div>
                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Gender</span>
                            <span>{request.blind_user?.gender || 'Not specified'}</span>
                        </div>
                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Email</span>
                            <span>{request.blind_user?.email || 'Not provided'}</span>
                        </div>
                        <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Phone</span>
                            <span>{request.blind_user?.phone_number || 'Not provided'}</span>
                        </div>
                        {request.blind_user?.address && (
                            <div style={{ ...styles.detailItem, gridColumn: '1 / -1' }}>
                                <span style={styles.detailLabel}>Address</span>
                                <span>{request.blind_user.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.metaSection}>
                    <div style={styles.metaItem}>
                        <FiClock style={styles.metaIcon} />
                        <div>
                            <div style={styles.metaLabel}>Requested On</div>
                            <div>{new Date(request.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {request.status === 'pending' && (
                    <div style={styles.actionButtons}>
                        <button
                            style={styles.acceptButton}
                            onClick={() => handleStatusUpdate('accepted')}
                            disabled={updating}
                        >
                            {updating ? 'Processing...' : (
                                <>
                                    <FiCheck style={{ marginRight: '8px' }} />
                                    Accept Request
                                </>
                            )}
                        </button>
                        <button
                            style={styles.rejectButton}
                            onClick={() => handleStatusUpdate('rejected')}
                            disabled={updating}
                        >
                            {updating ? 'Processing...' : (
                                <>
                                    <FiX style={{ marginRight: '8px' }} />
                                    Reject Request
                                </>
                            )}
                        </button>
                    </div>
                )}

                {request.status !== 'pending' && (
                    <div style={styles.statusMessage}>
                        This request has been {request.status}.
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
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
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '2rem',
        marginBottom: '2rem'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb'
    },
    avatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#e0e7ff',
        color: '#4f46e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: '600',
        marginRight: '1.5rem',
        flexShrink: 0
    },
    userName: {
        margin: '0 0 0.25rem 0',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#111827'
    },
    userId: {
        margin: '0 0 0.75rem 0',
        color: '#6b7280',
        fontSize: '0.95rem'
    },
    statusBadge: (status) => ({
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        backgroundColor:
            status === 'accepted' ? '#dcfce7' :
                status === 'rejected' ? '#fee2e2' : '#fef3c7',
        color:
            status === 'accepted' ? '#166534' :
                status === 'rejected' ? '#991b1b' : '#92400e'
    }),
    detailsSection: {
        marginBottom: '2rem'
    },
    sectionTitle: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 1.25rem 0',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #e5e7eb'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1.25rem'
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column'
    },
    detailLabel: {
        fontSize: '0.875rem',
        color: '#6b7280',
        marginBottom: '0.25rem'
    },
    metaSection: {
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1.5rem'
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center'
    },
    metaIcon: {
        color: '#6b7280',
        marginRight: '0.75rem',
        fontSize: '1.25rem'
    },
    metaLabel: {
        fontSize: '0.875rem',
        color: '#6b7280',
        marginBottom: '0.25rem'
    },
    actionButtons: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem'
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#059669'
        },
        '&:disabled': {
            backgroundColor: '#9ca3af',
            cursor: 'not-allowed'
        }
    },
    rejectButton: {
        flex: 1,
        backgroundColor: 'white',
        color: '#ef4444',
        border: '1px solid #ef4444',
        padding: '0.75rem 1.5rem',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        '&:hover': {
            backgroundColor: '#fef2f2'
        },
        '&:disabled': {
            opacity: 0.7,
            cursor: 'not-allowed'
        }
    },
    statusMessage: {
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        textAlign: 'center',
        color: '#4b5563',
        fontWeight: '500'
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

export default ConnectionRequest;