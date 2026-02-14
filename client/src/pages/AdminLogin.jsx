import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaArrowLeft } from 'react-icons/fa';
import API_URL from '../config';

const AdminLogin = () => {
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('/api/auth/verify', { secret });
            if (response.data.success) {
                localStorage.setItem('adminKey', secret);
                navigate('/dashboard');
            } else {
                setError('Invalid Secret Code');
            }
        } catch (err) {
            setError('Login Failed. Check server or code.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '1rem' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                    <FaLock size={30} color="#818cf8" />
                </div>

                <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>Admin Access</h2>

                <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <input
                        type="password"
                        placeholder="Enter Secret Code"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        className="glass-input"
                        style={{ width: '100%', padding: '12px' }}
                        autoFocus
                    />

                    {error && <div style={{ color: '#f87171', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

                    <button type="submit" className="glass-button" style={{ width: '100%', marginTop: '0.5rem' }}>
                        Unlock Dashboard
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <FaArrowLeft size={12} /> Back to Public View
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
