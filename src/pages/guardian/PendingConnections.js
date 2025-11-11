import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const PendingConnections = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingConnections();
  }, []);

  const fetchPendingConnections = async () => {
    try {
      setLoading(true);
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = authData?.user;
      if (!user) return;

      const { data: guardianData, error: guardianError } = await supabase
        .from('guardians')
        .select('guardian_id')
        .eq('email', user.email)
        .maybeSingle();
      if (guardianError || !guardianData) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const guardianId = guardianData.guardian_id;

      const { data, error } = await supabase
        .from('connections')
        .select(`
        id,
        blind_id,
        status,
        created_at,
        blind_users (name, age, gender)
      `)
        .eq('guardian_id', guardianId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Join error, falling back:', error);
        // fallback logic same as GuardianHome omitted for brevity — call fetchPendingRequests from GuardianHome if available
        setRequests([]);
        return;
      }

      const normalized = (data || []).map(row => {
        const blindInfo = row.blind_users ? (Array.isArray(row.blind_users) ? row.blind_users[0] : row.blind_users) : null;
        return { ...row, blind_user: blindInfo };
      });

      setRequests(normalized);
    } catch (err) {
      console.error('Error fetching pending connections:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleDecision = async (reqId, blindId, decision) => {
    try {
      await supabase
        .from('connections')
        .update({ status: decision, updated_at: new Date() })
        .eq('id', reqId);

      if (decision === 'accepted') {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: guardianData } = await supabase
          .from('guardians')
          .select('guardian_id')
          .eq('email', user.email)
          .single();

        await supabase
          .from('blind_users')
          .update({ guardian_id: guardianData.guardian_id })
          .eq('blind_id', blindId);
      }

      fetchPendingConnections();
      alert(`Request ${decision} successfully.`);
    } catch (err) {
      console.error('Error updating connection:', err);
      alert('Failed to update connection.');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <button
        onClick={() => navigate('/guardian/home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: '1px solid #ccc',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        <FiArrowLeft style={{ marginRight: '6px' }} /> Back
      </button>

      <h2>Pending Connection Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests right now.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          {requests.map(req => (
            <div key={req.id} style={{
              background: '#fff',
              padding: '1.5rem',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              <h3>{req.blind_user?.name || 'Unknown User'}</h3>
              <p>ID: {req.blind_id}</p>
              <p>Gender: {req.blind_user?.gender || 'N/A'}</p>
              <p>Age: {req.blind_user?.age || 'N/A'}</p>
              <p>Status: {req.status}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => handleDecision(req.id, req.blind_id, 'accepted')}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 15px',
                    cursor: 'pointer'
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecision(req.id, req.blind_id, 'rejected')}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 15px',
                    cursor: 'pointer'
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingConnections;
