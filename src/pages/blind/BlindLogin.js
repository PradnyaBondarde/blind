import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../styles/form.css';

const BlindLogin = () => {
    const [blindId, setBlindId] = useState('');
    const [guardianId, setGuardianId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const normalizedBlindId = blindId.trim();
    const normalizedGuardianId = guardianId.trim();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!blindId.trim() || !guardianId.trim()) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            // Verify blind ID exists
            const { data: blindData, error: blindError } = await supabase
                .from('blind_users')
                .select('*')
                .eq('blind_id', blindId.trim())
                .single();

            if (blindError || !blindData) {
                throw new Error('Invalid Blind ID. Please check and try again.');
            }

            // Verify guardian exists
            const { data: guardianData, error: guardianError } = await supabase
                .from('guardians')
                .select('guardian_id')
                .eq('guardian_id', guardianId.trim())
                .single();

            if (guardianError || !guardianData) {
                throw new Error('Guardian ID not found. Please verify the ID and try again.');
            }

            // Check for existing connection or pending request
            // Check for existing connection or pending request (use maybeSingle to avoid throw)
            const { data: existingConnection, error: existingError } = await supabase
                .from('connections')
                .select('id, status')
                .eq('blind_id', normalizedBlindId)
                .eq('guardian_id', normalizedGuardianId)
                .in('status', ['pending', 'accepted'])
                .maybeSingle();

            if (existingError) {
                console.error('Error checking existing connection:', existingError);
                throw new Error('Failed to check existing connection. Please try again.');
            }

            if (existingConnection) {
                if (existingConnection.status === 'pending') {
                    throw new Error('A connection request is already pending with this guardian.');
                } else if (existingConnection.status === 'accepted') {
                    navigate('/blind/connected', {
                        state: { blindId: normalizedBlindId, guardianId: normalizedGuardianId }
                    });
                    return;
                }
            }
            // Create new connection request
            const { error: insertError } = await supabase
                .from('connections')
                .insert([{
                    blind_id: normalizedBlindId,
                    guardian_id: normalizedGuardianId,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (insertError) {
                console.error('Insert error:', insertError);
                throw new Error(insertError.message || 'Failed to create connection request');
            }

            alert('✅ Connection request sent to Guardian. You will be notified when they respond.');
            navigate('/blind/connected', {
                state: {
                    blindId: blindId.trim(),
                    guardianId: guardianId.trim()
                }
            });

        } catch (error) {
            console.error('Connection request error:', error);
            alert(`❌ ${error.message || 'Failed to send connection request. Please try again.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Connect with Guardian</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="blindId">Your Blind ID</label>
                    <input
                        id="blindId"
                        type="text"
                        placeholder="Enter your Blind ID"
                        value={blindId}
                        onChange={(e) => setBlindId(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="guardianId">Guardian's ID</label>
                    <input
                        id="guardianId"
                        type="text"
                        placeholder="Enter Guardian's ID"
                        value={guardianId}
                        onChange={(e) => setGuardianId(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={isLoading ? 'loading' : ''}
                >
                    {isLoading ? 'Sending Request...' : 'Send Connection Request'}
                </button>
            </form>
            <style jsx>{`
                .form-container {
                    max-width: 500px;
                    margin: 2rem auto;
                    padding: 2rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #2d3748;
                }
                input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                input:focus {
                    outline: none;
                    border-color: #4299e1;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
                }
                button {
                    width: 100%;
                    padding: 0.75rem;
                    background-color: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                button:hover:not(:disabled) {
                    background-color: #4338ca;
                }
                button:disabled {
                    background-color: #a5b4fc;
                    cursor: not-allowed;
                }
                button.loading {
                    position: relative;
                    color: transparent;
                }
                button.loading::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    top: 50%;
                    left: 50%;
                    margin: -10px 0 0 -10px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default BlindLogin;
