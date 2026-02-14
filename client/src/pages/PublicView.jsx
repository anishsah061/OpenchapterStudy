import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFolder, FaFilePdf, FaArrowLeft, FaSearch } from 'react-icons/fa';
import SecureViewer from '../components/SecureViewer';
import { useNavigate } from 'react-router-dom';

const PublicView = () => {
    const [structure, setStructure] = useState([]);
    const [currentPosition, setCurrentPosition] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStructure();
    }, []);

    const fetchStructure = async () => {
        try {
            const res = await axios.get('/api/content/structure');
            setStructure(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const getCurrentItems = () => {
        let items = structure;
        for (const folder of currentPosition) {
            const found = items.find(i => i.name === folder.name && i.type === 'folder');
            if (found && found.children) {
                items = found.children;
            } else {
                return [];
            }
        }
        return items;
    };

    const handleNavigate = (folder) => {
        setCurrentPosition([...currentPosition, folder]);
    };

    const handleBack = () => {
        const newPos = [...currentPosition];
        newPos.pop();
        setCurrentPosition(newPos);
    };

    const handleFileClick = (file) => {
        setSelectedFile(file);
    };

    if (selectedFile) {
        return <SecureViewer file={selectedFile} onClose={() => setSelectedFile(null)} />;
    }

    const items = getCurrentItems();

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Open Chapter Study
                </h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/game')} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                        <FaGamepad /> Relax Area
                    </button>
                    <button onClick={() => navigate('/admin')} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '8px 16px' }}>
                        <FaUserShield /> Admin Login
                    </button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                <FaHome style={{ cursor: 'pointer' }} onClick={() => setCurrentPosition([])} />
                <span style={{ margin: '0 0.5rem' }}>/</span>
                {currentPosition.map((folder, idx) => (
                    <React.Fragment key={idx}>
                        <span
                            style={{ cursor: 'pointer', color: idx === currentPosition.length - 1 ? 'white' : 'inherit', fontWeight: idx === currentPosition.length - 1 ? 'bold' : 'normal' }}
                            onClick={() => setCurrentPosition(currentPosition.slice(0, idx + 1))}
                        >
                            {folder.name}
                        </span>
                        {idx < currentPosition.length - 1 && <span style={{ margin: '0 0.5rem' }}>/</span>}
                    </React.Fragment>
                ))}
            </div>

            {/* Content Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
                    {currentPosition.length > 0 && (
                        <div
                            onClick={handleBack}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                minHeight: '140px',
                                background: 'rgba(255, 255, 255, 0.02)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <FaArrowLeft size={30} color="#94a3b8" />
                            <span style={{ marginTop: '1rem', color: '#94a3b8' }}>Back</span>
                        </div>
                    )}

                    {items.map((item) => (
                        <div
                            key={item.path}
                            onClick={() => item.type === 'folder' ? handleNavigate(item) : handleFileClick(item)}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                minHeight: '140px',
                                background: 'rgba(255, 255, 255, 0.05)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            {item.type === 'folder' ? (
                                <FaFolder size={48} color="#fbbf24" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                            ) : (
                                <FaFilePdf size={48} color="#f87171" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                            )}
                            <span style={{ marginTop: '1rem', textAlign: 'center', wordBreak: 'break-word', fontSize: '0.9rem', fontWeight: '500' }}>
                                {item.name}
                            </span>
                        </div>
                    ))}

                    {items.length === 0 && !loading && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <p>This folder is empty.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicView;
