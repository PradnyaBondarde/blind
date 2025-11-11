import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FiUser, FiUsers, FiSettings, FiLogOut, FiBell, FiUserCheck, FiUserX } from 'react-icons/fi';

const GuardianHome = () => {
    const [guardian, setGuardian] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('Dashboard');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        connectedUsers: 0,
        acceptedProfiles: 0,
        rejectedProfiles: 0,
        pendingRequests: 0
    });

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchGuardian();
                await fetchPendingRequests();
                await fetchStats();
            } catch (error) {
                console.error('Error in initial data fetch:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Set up periodic refresh every 10 seconds
        const interval = setInterval(fetchPendingRequests, 10000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!guardian?.guardian_id) return;

        const gid = guardian.guardian_id;

        const channel = supabase
            .channel(`public:connections:guardian:${gid}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'connections', filter: `guardian_id=eq.${gid}` }, payload => {
                if (payload.new?.status === 'pending') {
                    // fetch latest instead of trusting payload shape (keeps shape consistent)
                    fetchPendingRequests();
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'connections', filter: `guardian_id=eq.${gid}` }, payload => {
                // refresh list on update (status changed)
                fetchPendingRequests();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [guardian?.guardian_id]);


    const fetchGuardian = async () => {
        try {
            const { data, error } = await supabase
                .from('guardians')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setGuardian(data);
        } catch (error) {
            console.error('Error fetching guardian:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const { data: authData, error: authErr } = await supabase.auth.getUser();
            if (authErr) throw authErr;
            const user = authData?.user;
            if (!user) return;

            // Get guardian_id for logged-in user by email (exact match)
            const { data: guardianData, error: guardianError } = await supabase
                .from('guardians')
                .select('guardian_id')
                .eq('email', user.email)
                .maybeSingle();

            if (guardianError || !guardianData) {
                console.warn('Guardian not found for user email', user.email);
                setPendingRequests([]);
                setPendingCount(0);
                setStats(prev => ({ ...prev, pendingRequests: 0 }));
                return;
            }

            const guardianId = guardianData.guardian_id;

            // Fetch pending connections for this guardian (use eq for exact match)
            // Try to fetch related blind user fields using the table name 'blind_users' (most common)
            const { data, error } = await supabase
                .from('connections')
                .select(`
        id,
        blind_id,
        guardian_id,
        status,
        created_at,
        blind_users (name, age, gender)
      `)
                .eq('guardian_id', guardianId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            // If the above returns an error due to relation not existing, fall back to simple select
            if (error) {
                console.warn('Join-select error, falling back to separate fetch:', error.message || error);
                const { data: rows, error: rowsErr } = await supabase
                    .from('connections')
                    .select('id, blind_id, guardian_id, status, created_at')
                    .eq('guardian_id', guardianId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (rowsErr) throw rowsErr;

                // fetch blind user info in batch
                const blindIds = rows.map(r => r.blind_id);
                const { data: blindUsers } = await supabase
                    .from('blind_users')
                    .select('blind_id, name, age, gender')
                    .in('blind_id', blindIds || []);

                const blindMap = (blindUsers || []).reduce((acc, b) => {
                    acc[b.blind_id] = b;
                    return acc;
                }, {});

                const normalized = (rows || []).map(r => ({
                    ...r,
                    blind_user: blindMap[r.blind_id] || null
                }));

                setPendingRequests(normalized);
                setPendingCount(normalized.length);
                setStats(prev => ({ ...prev, pendingRequests: normalized.length }));
                return;
            }

            // Normalize shape (Supabase returns related rows as arrays if using foreign tables)
            const normalized = (data || []).map(row => {
                const blindInfo = row.blind_users ? (Array.isArray(row.blind_users) ? row.blind_users[0] : row.blind_users) : null;
                return {
                    id: row.id,
                    blind_id: row.blind_id,
                    guardian_id: row.guardian_id,
                    status: row.status,
                    created_at: row.created_at,
                    blind_user: blindInfo
                };
            });

            setPendingRequests(normalized);
            setPendingCount(normalized.length);
            setStats(prev => ({ ...prev, pendingRequests: normalized.length }));
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        }
    };



    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get guardian_id from guardians table
            const { data: guardianData, error: guardianError } = await supabase
                .from('guardians')
                .select('guardian_id')
                .eq('email', user.email)
                .single();

            if (guardianError || !guardianData) {
                throw new Error('Guardian profile not found');
            }

            // Get connected users count
            const { count: connectedCount } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .eq('guardian_id', guardianData.guardian_id)
                .eq('status', 'accepted');

            // Get pending connection requests count
            const { count: pendingRequestsCount } = await supabase
                .from('connections')
                .select('*', { count: 'exact', head: true })
                .eq('guardian_id', guardianData.guardian_id)
                .eq('status', 'pending');


            // Get registration stats (if still needed)
            const { count: acceptedCount } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved');

            const { count: rejectedCount } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'rejected');

            setStats({
                connectedUsers: connectedCount || 0,
                acceptedProfiles: acceptedCount || 0,
                rejectedProfiles: rejectedCount || 0,
                pendingRequests: pendingRequestsCount || 0
            });

            // Also update pending count state
            setPendingCount(pendingRequestsCount || 0);

        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const menuItems = [
        { name: 'Dashboard', icon: <FiUser size={20} /> },
        { name: 'Profile', icon: <FiUser size={20} /> },
        {
            name: 'Connected Users',
            icon: <div style={{ position: 'relative' }}>
                <FiUsers size={20} />
                {pendingCount > 0 && (
                    <span style={styles.notificationBadge}>
                        {pendingCount}
                    </span>
                )}
            </div>
        },
        { name: 'Settings', icon: <FiSettings size={20} /> },
        { name: 'Logout', icon: <FiLogOut size={20} /> }
    ];

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            console.log('Logging out...');
            // In real app: navigate('/guardianlogin');
        }
    };

    const handleMenuClick = async (menuName) => {
        setActiveMenu(menuName);
        switch (menuName) {
            case 'Logout':
                await handleLogout();
                break;
            case 'Profile':
                navigate('/guardian/viewprofile', { state: { guardian } });
                break;
            case 'Dashboard':
                navigate('/guardian/home');
                break;
            case 'Connected Users':
                // Refresh data before navigating
                await fetchPendingRequests();
                navigate('/guardian/pending-connections');
                break;
            default:
                break;
        }
    };

    const handleViewRequest = (requestId) => {
        navigate(`/guardian/request/${requestId}`);
    };

    // Update the handleApprove function
    const handleApprove = async (connectionId, blindId) => {
        try {
            const { error } = await supabase
                .from('connections')
                .update({
                    status: 'accepted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', connectionId);

            if (error) throw error;

            // Update blind_user's guardian_id with case-insensitive comparison
            const { error: updateError } = await supabase
                .from('blind_users')
                .update({ guardian_id: guardian.guardian_id })
                .ilike('id', blindId);

            if (updateError) throw updateError;

            // The real-time subscription will handle the UI update
        } catch (error) {
            console.error('Error approving connection:', error);
        }
    };

    // Update the handleReject function
    const handleReject = async (connectionId) => {
        try {
            const { error } = await supabase
                .from('connections')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', connectionId);

            if (error) throw error;
            // The real-time subscription will handle the UI update
        } catch (error) {
            console.error('Error rejecting connection:', error);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}>Loading dashboard...</div>
            </div>
        );
    }

    if (!guardian) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.error}>No guardian found</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div style={styles.profileSection}>
                    <div style={styles.avatarCircle}>
                        {guardian.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.profileInfo}>
                        <h3 style={styles.profileName}>{guardian.name}</h3>
                        <p style={styles.guardianIdText}>{guardian.guardian_id}</p>
                    </div>
                </div>

                <div style={styles.dashboardTitleSection}>
                    <h2 style={styles.dashboardTitle}>Guardian Dashboard</h2>
                </div>

                <nav style={styles.nav}>
                    {menuItems.map((item) => (
                        <div
                            key={item.name}
                            style={{
                                ...styles.menuItem,
                                ...(activeMenu === item.name ? styles.menuItemActive : {})
                            }}
                            onClick={() => handleMenuClick(item.name)}
                            className={`menu-item ${activeMenu === item.name ? 'active' : ''}`}
                        >
                            <span style={styles.menuIcon}>{item.icon}</span>
                            <span style={styles.menuText}>{item.name}</span>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                <div style={styles.welcomeHeader}>
                    <h1 style={styles.welcomeTitle}>Welcome to Guardian Dashboard</h1>
                    <p style={styles.welcomeSubtitle}>
                        Manage your connected users and monitor profile requests
                    </p>
                </div>

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <div style={{
                        marginBottom: '32px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h2 style={{
                            margin: '0 0 20px 0',
                            fontSize: '20px',
                            color: '#2d3748',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>🔔</span> Pending Connection Requests
                        </h2>
                        <div style={{
                            display: 'grid',
                            gap: '12px'
                        }}>
                            {pendingRequests.map(request => (
                                <div
                                    key={request.id}
                                    style={{
                                        background: '#ffffff',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        borderLeft: '4px solid #667eea'
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            fontWeight: '600',
                                            marginBottom: '4px'
                                        }}>
                                            Request from: {request.blind_user?.name || 'Unknown User'}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#718096'
                                        }}>
                                            {new Date(request.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/guardian/request/${request.id}`)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        Review Request
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Cards Grid */}
                <div style={styles.statsGrid}>
                    <div style={styles.card} className="stat-card">
                        <div style={styles.cardIcon}>
                            <FiUsers size={32} />
                        </div>
                        <h3 style={styles.cardTitle}>Connected Users</h3>
                        <div style={styles.cardNumber}>{stats.connectedUsers}</div>
                        <p style={styles.cardSubtext}>Active connections</p>
                    </div>

                    <div style={styles.card} className="stat-card">
                        <div style={styles.cardIcon}>
                            <FiUserCheck size={32} />
                        </div>
                        <h3 style={styles.cardTitle}>Accepted Profiles</h3>
                        <div style={styles.cardNumber}>{stats.acceptedProfiles}</div>
                        <p style={styles.cardSubtext}>Approved registrations</p>
                    </div>

                    <div style={styles.card} className="stat-card">
                        <div style={styles.cardIcon}>
                            <FiUserX size={32} />
                        </div>
                        <h3 style={styles.cardTitle}>Rejected Profiles</h3>
                        <div style={styles.cardNumber}>{stats.rejectedProfiles}</div>
                        <p style={styles.cardSubtext}>Rejected registrations</p>
                    </div>

                    <div
                        style={{
                            ...styles.card,
                            ...(pendingCount > 0 ? styles.pendingCard : {})
                        }}
                        className="stat-card"
                        onClick={() => navigate('/guardian/PendingConnections')}
                    >
                        <div style={styles.cardIcon}>
                            <FiBell size={32} />
                            {pendingCount > 0 && (
                                <span style={styles.floatingBadge}>{pendingCount}</span>
                            )}
                        </div>
                        <h3 style={styles.cardTitle}>Pending Requests</h3>
                        <div style={styles.cardNumber}>{pendingCount}</div>
                        <p style={styles.cardSubtext}>
                            {pendingCount === 1 ? 'Connection request' : 'Connection requests'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflowX: 'hidden'
    },
    sidebar: {
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        boxShadow: '2px 0 12px rgba(0, 0, 0, 0.05)'
    },
    profileSection: {
        display: 'flex',
        alignItems: 'center',
        padding: '24px 20px',
        borderBottom: '1px solid #e2e8f0',
        gap: '12px'
    },
    avatarCircle: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#667eea',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '700',
        flexShrink: 0
    },
    profileInfo: {
        flex: 1,
        minWidth: 0
    },
    profileName: {
        margin: '0 0 4px 0',
        fontSize: '16px',
        fontWeight: '700',
        color: '#1a202c',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    guardianIdText: {
        margin: 0,
        fontSize: '13px',
        color: '#a0aec0',
        fontWeight: '500'
    },
    dashboardTitleSection: {
        padding: '24px 20px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0'
    },
    dashboardTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '700',
        color: '#2d3748',
        letterSpacing: '0.5px'
    },
    nav: {
        flex: 1,
        padding: '20px 0',
        overflowY: 'auto'
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        gap: '12px',
        color: '#718096',
        margin: '4px 12px',
        borderRadius: '8px'
    },
    menuItemActive: {
        backgroundColor: '#667eea',
        color: '#ffffff',
        fontWeight: '600'
    },
    menuIcon: {
        fontSize: '20px',
        width: '24px',
        textAlign: 'center'
    },
    menuText: {
        fontSize: '15px',
        fontWeight: '500'
    },
    mainContent: {
        flex: 1,
        marginLeft: '280px',
        padding: '2rem',
        overflowY: 'auto',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        paddingLeft: '300px',
        paddingRight: '2rem'
    },
    welcomeHeader: {
        marginBottom: '32px'
    },
    welcomeTitle: {
        margin: '0 0 8px 0',
        fontSize: '32px',
        fontWeight: '700',
        color: '#1a202c'
    },
    welcomeSubtitle: {
        margin: 0,
        fontSize: '16px',
        color: '#718096'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem',
        width: '100%',
        maxWidth: '1200px'
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        // note: quoted keys below are valid JS keys; they won't be applied automatically
        "&:hover": {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
        }
    },
    cardIcon: {
        fontSize: '2.5rem',
        marginBottom: '1rem',
        color: '#4f46e5',
        position: 'relative',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#eef2ff',
        margin: '0 auto 1rem',
        "& svg": {
            color: '#4f46e5',
        }
    },
    cardTitle: {
        margin: '0 0 0.5rem 0',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#4a5568',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        opacity: 0.8
    },
    cardNumber: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0.5rem 0',
        lineHeight: 1.2,
        fontFamily: 'Inter, sans-serif'
    },
    cardSubtext: {
        margin: 0,
        fontSize: '0.875rem',
        color: '#6b7280',
        fontWeight: '500'
    },
    pendingCard: {
        borderLeft: '4px solid #f59e0b',
        "&:hover": {
            borderLeftColor: '#d97706'
        }
    },
    notificationBadge: {
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        backgroundColor: '#ef4444',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 'bold'
    },
    floatingBadge: {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#ef4444',
        color: 'white',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    pendingRequestsContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1.5rem',
        justifyContent: 'space-between'
    },
    sectionTitle: {
        margin: 0,
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        display: 'flex',
        alignItems: 'center'
    },
    badge: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600'
    },
    requestsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginTop: '1rem'
    },
    requestCard: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s ease',
        "&:hover": {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }
    },
    requestHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem'
    },
    avatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#e0e7ff',
        color: '#4f46e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        fontWeight: '600',
        marginRight: '1rem',
        flexShrink: 0
    },
    requestName: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#111827',
        textAlign: 'left'
    },
    requestId: {
        margin: '0.25rem 0 0',
        fontSize: '0.875rem',
        color: '#6b7280',
        textAlign: 'left'
    },
    requestDetails: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        textAlign: 'left'
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    detailLabel: {
        fontSize: '0.75rem',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '600'
    },
    viewButton: {
        width: '100%',
        padding: '0.5rem',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    viewAllContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '1rem',
        gridColumn: '1 / -1'
    },
    viewAllButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#4f46e5',
        fontWeight: '600',
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    loadingContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa'
    },
    loader: {
        fontSize: '20px',
        color: '#667eea',
        fontWeight: '600'
    },
    error: {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#fc8181',
        padding: '20px 40px',
        borderRadius: '12px',
        fontWeight: '600'
    }
};

// Add global styles for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    .stat-card {
        animation: fadeIn 0.5s ease-out forwards;
        opacity: 0;
    }
    .stat-card:nth-child(1) { animation-delay: 0.1s; }
    .stat-card:nth-child(2) { animation-delay: 0.2s; }
    .stat-card:nth-child(3) { animation-delay: 0.3s; }
    .stat-card:nth-child(4) { 
        animation-delay: 0.4s; 
        position: relative;
    }
    .stat-card.has-notification {
        animation: pulse 2s infinite;
    }
    .menu-item {
        transition: all 0.2s ease;
    }
    .menu-item:hover {
        background-color: #f3f4f6 !important;
        transform: translateX(4px);
    }
    .menu-item.active {
        background-color: #eef2ff !important;
        color: #4f46e5 !important;
        font-weight: 600;
    }
    @media (max-width: 1024px) {
        .mainContent {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
            margin-left: 0 !important;
            width: 100% !important;
        }
        .statsGrid {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }
    @media (max-width: 768px) {
        .sidebar {
            width: 100% !important;
            position: fixed !important;
            height: auto !important;
            bottom: 0;
            top: auto !important;
            z-index: 1000;
            border-top: 1px solid #e5e7eb;
            border-right: none !important;
            padding: 0.5rem !important;
        }
        .mainContent {
            padding-bottom: 80px !important;
        }
        .profileSection {
            display: none !important;
        }
        .dashboardTitleSection {
            display: none !important;
        }
        .nav {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-around;
            padding: 0.5rem !important;
        }
        .menu-item {
            flex-direction: column !important;
            padding: 0.75rem 0.5rem !important;
            font-size: 0.7rem !important;
            text-align: center;
            border-radius: 8px !important;
            margin: 0 0.25rem !important;
        }
        .menuIcon {
            margin-right: 0 !important;
            margin-bottom: 0.25rem;
        }
        .statsGrid {
            grid-template-columns: 1fr 1fr !important;
            gap: 1rem !important;
        }
        .pendingRequestsContainer {
            padding: 1rem !important;
        }
        .requestsGrid {
            grid-template-columns: 1fr !important;
        }
        .card {
            padding: 1rem !important;
        }
    }
    @media (max-width: 480px) {
        .cardNumber {
            font-size: 1.75rem !important;
        }
    }
`;
document.head.appendChild(styleSheet);

export default GuardianHome;
