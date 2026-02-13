const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const Content = require('../models/Content');
const path = require('path');

// --- GridFS & Multer Setup ---
let gfsBucket;

const conn = mongoose.connection;
conn.once('open', () => {
    // Initialize GridFS Bucket
    gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
});

const { Readable } = require('stream');

// Multer for memory storage (buffer is needed for S3 upload) - NOW used for manual GridFS streaming
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to verify admin secret
const verifyAdmin = (req, res, next) => {
    const secret = req.headers['x-admin-secret'];
    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET /api/content/structure
// Returns the directory structure by querying Content model
router.get('/structure', async (req, res) => {
    try {
        const items = await Content.find({});

        // Build Tree
        const buildTree = (parentPath) => {
            return items
                .filter(item => item.parentPath === parentPath)
                .map(item => {
                    if (item.type === 'folder') {
                        // Construct current full path (FIX: Keep ROOT prefix to match DB storage)
                        const currentFullPath = `${parentPath}/${item.name}`;
                        return {
                            name: item.name,
                            type: 'folder',
                            path: currentFullPath,
                            children: buildTree(currentFullPath)
                        };
                    } else {
                        // File
                        return {
                            name: item.name,
                            type: 'file',
                            path: item.path,
                            fileId: item.fileId
                        };
                    }
                });
        };

        const structure = buildTree('ROOT');
        res.json(structure);
    } catch (error) {
        console.error('Error getting structure:', error);
        res.status(500).json({ error: 'Failed to retrieve structure' });
    }
});

// POST /api/content/upload
// Upload a file to GridFS (via manual stream) and metadata to MongoDB
router.post('/upload', verifyAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!gfsBucket) {
        return res.status(500).json({ error: 'GridFS not initialized' });
    }

    // parentPath comes from frontend ("ROOT" or "ROOT/Class10")
    let parentPath = req.body.path || 'ROOT';
    // Remove leading/trailing slashes
    parentPath = parentPath.replace(/^\/+|\/+$/g, '');

    // Enforce ROOT prefix
    if (!parentPath.startsWith('ROOT')) {
        parentPath = parentPath ? `ROOT/${parentPath}` : 'ROOT';
    }

    const fileName = req.file.originalname;

    try {
        // Create upload stream
        const uploadStream = gfsBucket.openUploadStream(fileName, {
            metadata: {
                originalName: req.file.originalname,
                mimetype: req.file.mimetype
            }
        });

        const bufferStream = Readable.from(req.file.buffer);

        bufferStream.pipe(uploadStream)
            .on('error', (error) => {
                console.error('GridFS streaming error:', error);
                res.status(500).json({ error: 'Error uploading file' });
            })
            .on('finish', async () => {
                console.log('File streamed to GridFS, ID:', uploadStream.id);

                try {
                    // Save Metadata to MongoDB
                    const newFile = new Content({
                        parentPath: parentPath,
                        name: fileName,
                        type: 'file',
                        path: parentPath === 'ROOT' ? fileName : `${parentPath}/${fileName}`,
                        fileId: uploadStream.id // GridFS file ID from the stream
                    });

                    await newFile.save();
                    res.json({ success: true, message: 'File uploaded successfully', fileId: uploadStream.id });
                } catch (metaError) {
                    console.error('Metadata save error:', metaError);
                    // Cleanup orphan file in GridFS ? 
                    // For now just report error
                    res.status(500).json({ error: 'File stored but metadata failed: ' + metaError.message });
                }
            });

    } catch (err) {
        console.error("Upload Error", err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/content/create-folder
router.post('/create-folder', verifyAdmin, async (req, res) => {
    const { path: folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'Path required' });

    let cleanPath = folderPath.replace(/^\/+|\/+$/g, '');
    if (!cleanPath.startsWith('ROOT')) {
        cleanPath = cleanPath ? `ROOT/${cleanPath}` : 'ROOT';
    }

    const parts = cleanPath.split('/');
    const folderName = parts.pop();
    const parent = parts.join('/');

    if (!folderName) return res.status(400).json({ error: 'Invalid folder name' });

    try {
        const newFolder = new Content({
            parentPath: parent,
            name: folderName,
            type: 'folder',
            path: cleanPath // Storing the full virtual path for folders if useful
        });

        await newFolder.save();
        res.json({ success: true, message: 'Folder created' });
    } catch (err) {
        console.error("Create Folder Error", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Folder already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/content/delete
router.delete('/delete', verifyAdmin, async (req, res) => {
    const { path: itemPath } = req.body; // e.g., "ROOT/file.pdf"
    if (!itemPath) return res.status(400).json({ error: 'Path required' });

    // Try to find the item by path (which we stored)
    // OR parse parent/name. The schema has parentPath + name.
    // Let's parse parent/name from the virtual path.

    let pathStr = itemPath;
    if (!pathStr.startsWith('ROOT')) pathStr = 'ROOT/' + pathStr;

    const lastSlash = pathStr.lastIndexOf('/');
    let targetParent = pathStr.substring(0, lastSlash);
    let targetName = pathStr.substring(lastSlash + 1);

    // ... (previous code)
    try {
        let item = await Content.findOne({ parentPath: targetParent, name: targetName });

        // Fallback: Check without ROOT/ prefix if not found (for legacy data)
        if (!item && targetParent.startsWith('ROOT/')) {
            const fallbackParent = targetParent.replace(/^ROOT\//, '');
            item = await Content.findOne({ parentPath: fallbackParent, name: targetName });
            if (item) console.log(`DEBUG Delete: Found item via fallback path: ${fallbackParent}/${targetName}`);
        }

        if (!item) {
            return res.status(404).json({ error: 'Not found' });
        }

        console.log(`DEBUG Delete: Found item ${item._id}, type=${item.type}, fileId=${item.fileId}`);

        // 1. If file, delete from GridFS
        if (item.type === 'file' && item.fileId) {
            if (gfsBucket) {
                try {
                    // unexpected: fileId might be string or ObjectId. 
                    const _id = new mongoose.Types.ObjectId(item.fileId);
                    await gfsBucket.delete(_id);
                    console.log(`DEBUG Delete: Valid GridFS file deleted: ${_id}`);
                } catch (e) {
                    console.warn(`GridFS file not found or handle error: ${item.fileId}`, e.message);
                }
            } else {
                console.error("DEBUG Delete: gfsBucket is not initialized");
                return res.status(500).json({ error: 'Storage not initialized' });
            }
        }

        // 2. Delete from MongoDB Metadata
        await Content.deleteOne({ _id: item._id });

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error("Delete Error", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/content/stream/:path*
router.get(/^\/stream\/(.+)$/, async (req, res) => {
    const virtualPath = req.params[0];

    let pathStr = virtualPath;
    if (!pathStr.startsWith('ROOT')) pathStr = 'ROOT/' + pathStr;

    const lastSlash = pathStr.lastIndexOf('/');
    let targetParent = pathStr.substring(0, lastSlash);
    let targetName = pathStr.substring(lastSlash + 1);

    console.log(`DEBUG Stream: virtualPath=${virtualPath}, pathStr=${pathStr}`);
    console.log(`DEBUG Stream: targetParent=${targetParent}, targetName=${targetName}`);

    try {
        let item = await Content.findOne({ parentPath: targetParent, name: targetName });

        // Fallback: Check without ROOT/ prefix if not found (for legacy data)
        if (!item && targetParent.startsWith('ROOT/')) {
            const fallbackParent = targetParent.replace(/^ROOT\//, '');
            item = await Content.findOne({ parentPath: fallbackParent, name: targetName });
            if (item) console.log(`DEBUG Stream: Found item via fallback path: ${fallbackParent}/${targetName}`);
        }

        if (!item || !item.fileId) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!gfsBucket) {
            return res.status(500).json({ error: 'GridFS not initialized' });
        }

        const downloadStream = gfsBucket.openDownloadStream(item.fileId);

        if (pathStr.toLowerCase().endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
        }
        res.setHeader('Content-Disposition', 'inline');

        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error('Stream error:', err);
            res.status(404).json({ error: 'File not found in storage' });
        });

    } catch (err) {
        console.error("Stream Error", err);
        res.status(500).json({ error: "Failed to stream file" });
    }
});

module.exports = router;
