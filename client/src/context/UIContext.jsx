import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [modal, setModal] = useState(null);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showModal = useCallback((content) => {
        setModal(content);
    }, []);

    const closeModal = useCallback(() => {
        setModal(null);
    }, []);

    return (
        <UIContext.Provider value={{ addToast, showModal, closeModal }}>
            {children}

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className="toast" style={{ borderLeft: `4px solid ${toast.type === 'error' ? '#ff4d4d' : '#4caf50'}` }}>
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Modal Container */}
            {modal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 10000
                }} onClick={closeModal}>
                    <div onClick={e => e.stopPropagation()} className="glass-panel animate-fade-in" style={{ padding: '2rem', minWidth: '300px', maxWidth: '90%' }}>
                        {modal}
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};
