import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/card.css';
import '../../styles/home.css';

const GuardianConnections = () => {
    const [requests, setRequests] = useState([]);
    const guardianId = 'GUARDIAN001'; // Replace this with logged-in guardian ID later

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('connections')
            .select('*')
            .eq('guardian_id', guardianId)
            .eq('status', 'pending');

        if (error) console.error(error);
        else setRequests(data);
    };

    const handleDecision = async (reqId, blindId, decision) => {
        // Update connection status
        await supabase
            .from('connections')
            .update({ status: decision, updated_at: new Date() })
            .eq('id', reqId);

        // If accepted, link guardian in blind_users
        if (decision === 'accepted') {
            await supabase
                .from('blind_users')
                .update({ guardian_id: guardianId })
                .eq('blind_id', blindId);
        }

        // Refresh requests
        fetchRequests();
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <>
            <Navbar userType="guardian" />
            <div className="home-container">
                <h1>Pending Connection Requests</h1>
                {requests.length === 0 ? (
                    <p>No pending requests right now.</p>
                ) : (
                    <div className="card-container">
                        {requests.map((req) => (
                            <div className="card" key={req.id}>
                                <h4>Blind User ID: {req.blind_id}</h4>
                                <p>Status: {req.status}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        style={{
                                            backgroundColor: '#27ae60',
                                            color: 'white',
                                            padding: '8px 15px',
                                            borderRadius: '6px',
                                        }}
                                        onClick={() => handleDecision(req.id, req.blind_id, 'accepted')}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        style={{
                                            backgroundColor: '#e74c3c',
                                            color: 'white',
                                            padding: '8px 15px',
                                            borderRadius: '6px',
                                        }}
                                        onClick={() => handleDecision(req.id, req.blind_id, 'rejected')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default GuardianConnections;
