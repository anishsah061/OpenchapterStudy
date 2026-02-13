import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

const SecureViewer = ({ file, onClose }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        // Disable keyboard shortcuts
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
                e.preventDefault();
                alert('Printing and Saving are disabled.');
            }
        };

        // Disable context menu
        const handleContextMenu = (e) => e.preventDefault();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    // Construct stream URL
    // We use encodeURI to preserve slashes in the path
    const fileUrl = `/api/content/stream/${encodeURI(file.path)}`;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
            WebkitUserSelect: 'none'
        }}>
            <div style={{ padding: '1rem', background: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{file.name}</span>
                <div>
                    <button disabled={pageNumber <= 1} onClick={() => setPageNumber(prev => prev - 1)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4b5563', color: 'white', cursor: 'pointer' }}>Prev</button>
                    <span style={{ margin: '0 1rem' }}>{pageNumber} / {numPages || '--'}</span>
                    <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(prev => prev + 1)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4b5563', color: 'white', cursor: 'pointer' }}>Next</button>
                    <button onClick={onClose} style={{ marginLeft: '1rem', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(err) => setError('Failed to load PDF')}
                    loading={<div>Loading PDF...</div>}
                >
                    <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>

                {/* Watermark Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                    fontSize: '4rem',
                    color: 'rgba(255, 0, 0, 0.1)',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    fontWeight: 'bold',
                    zIndex: 10
                }}>
                    Open Chapter Study
                </div>
            </div>
            {error && <div style={{ color: 'white', textAlign: 'center' }}>{error}</div>}
        </div>
    );
};

export default SecureViewer;
