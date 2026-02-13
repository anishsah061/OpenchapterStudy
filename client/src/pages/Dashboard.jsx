import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFolder, FaFilePdf, FaTrash, FaFileUpload, FaFolderPlus, FaPowerOff, FaSync, FaChartPie, FaArrowUp } from 'react-icons/fa';
import { useUI } from '../context/UIContext';

const Dashboard = () => {
    const [structure, setStructure] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadFile, setUploadFile] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedPath, setSelectedPath] = useState(''); // Current folder focus
    const navigate = useNavigate();
    const { addToast, showModal, closeModal } = useUI();

    const adminKey = localStorage.getItem('adminKey');

    useEffect(() => {
        if (!adminKey) {
            navigate('/admin');
            return;
        }
        fetchStructure();
    }, [adminKey, navigate]);

    const fetchStructure = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/content/structure');
            setStructure(res.data);
            setLoading(false);
        } catch (err) {
            addToast('Failed to fetch file structure', 'error');
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('path', selectedPath);

        try {
            await axios.post('/api/content/upload', formData, {
                headers: {
                    'x-admin-secret': adminKey,
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchStructure();
            setUploadFile(null);
            addToast('File uploaded successfully!', 'success');
        } catch (err) {
            addToast('Upload failed', 'error');
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName) return;

        const folderPath = selectedPath ? `${selectedPath}/${newFolderName}` : newFolderName;

        try {
            await axios.post('/api/content/create-folder', { path: folderPath }, {
                headers: { 'x-admin-secret': adminKey }
            });
            fetchStructure();
            setNewFolderName('');
            addToast(`Folder "${newFolderName}" created`, 'success');
        } catch (err) {
            addToast('Create folder failed', 'error');
        }
    };

    const confirmDelete = (path) => {
        showModal(
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem' }}>Confirm Deletion</h3>
                <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
                    Are you sure you want to delete <strong>{path}</strong>?
                    <br />
                    This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="glass-button" style={{ background: '#ef4444' }} onClick={() => performDelete(path)}>
                        Yes, Delete
                    </button>
                    <button className="glass-button" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={closeModal}>
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    const performDelete = async (path) => {
        closeModal();
        try {
            await axios.delete('/api/content/delete', {
                headers: { 'x-admin-secret': adminKey },
                data: { path }
            });
            fetchStructure();
            addToast('Item deleted successfully', 'success');
        } catch (err) {
            addToast('Delete failed', 'error');
        }
    };

    const renderTree = (items, level = 0) => {
        if (!items || items.length === 0) return <div style={{ padding: '0.5rem', opacity: 0.5, fontSize: '0.9rem' }}>Empty</div>;

        return (
            <div style={{ paddingLeft: level ? '1.5rem' : '0' }}>
                {items.map((item) => (
                    <div key={item.path} style={{ margin: '0.5rem 0' }}>
                        <div
                            className="glass-panel"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                padding: '0.8rem',
                                background: item.path === selectedPath ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                                borderColor: item.path === selectedPath ? '#6366f1' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.type === 'folder' ? <FaFolder color="#fbbf24" /> : <FaFilePdf color="#f87171" />}

                            <span
                                style={{
                                    cursor: item.type === 'folder' ? 'pointer' : 'default',
                                    fontWeight: item.path === selectedPath ? '600' : 'normal',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                                onClick={() => item.type === 'folder' && setSelectedPath(item.path)}
                            >
                                {item.name}
                            </span>

                            {item.type === 'folder' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedPath(item.path); }}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                                    title="Select Folder"
                                >
                                    Select
                                </button>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); confirmDelete(item.path); }}
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                                title="Delete"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                        {item.children && renderTree(item.children, level + 1)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside className="glass-panel" style={{ width: '280px', margin: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaChartPie color="#a855f7" /> Dashboard
                    </h2>
                </div>

                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Actions</h4>
                        <button
                            className="glass-button"
                            style={{ width: '100%', marginTop: '1rem', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => setSelectedPath('')}
                        >
                            <FaArrowUp /> Select Root
                        </button>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Path</h4>
                        <div className="glass-input" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6366f1', fontFamily: 'monospace' }}>
                            {selectedPath || 'ROOT'}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => { localStorage.removeItem('adminKey'); navigate('/'); }}
                        style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '10px' }}
                    >
                        <FaPowerOff /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem' }}>File Manager</h1>
                    <button onClick={fetchStructure} className="glass-button" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <FaSync className={loading ? 'loader-spin' : ''} /> Refresh
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
                    {/* Structure Tree */}
                    <div className="glass-panel" style={{ padding: '1.5rem', overflowY: 'auto', borderRadius: '16px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaFolder color="#fbbf24" /> Files & Folders
                        </h3>
                        {loading ? <div className="loader" style={{ margin: '2rem auto' }}></div> : renderTree(structure)}
                    </div>

                    {/* Actions Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Upload */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>Upload File</h3>
                            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{
                                    cursor: 'pointer', padding: '20px', border: '2px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '8px', textAlign: 'center', color: '#94a3b8', transition: 'border-color 0.2s'
                                }}>
                                    <FaFileUpload size={24} style={{ marginBottom: '0.5rem', display: 'block', width: '100%' }} />
                                    {uploadFile ? <span style={{ color: '#6366f1' }}>{uploadFile.name}</span> : 'Click to Choose File'}
                                    <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} style={{ display: 'none' }} />
                                </label>
                                <button type="submit" className="glass-button" disabled={!uploadFile} style={{ opacity: uploadFile ? 1 : 0.5 }}>
                                    Upload to {selectedPath ? `.../${selectedPath.split('/').pop()}` : 'Root'}
                                </button>
                            </form>
                        </div>

                        {/* Create Folder */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>New Folder</h3>
                            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <FaFolderPlus style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        placeholder="Folder Name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        className="glass-input"
                                        style={{ width: '100%', paddingLeft: '35px' }}
                                    />
                                </div>
                                <button type="submit" className="glass-button" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                    Create in {selectedPath ? `.../${selectedPath.split('/').pop()}` : 'Root'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
