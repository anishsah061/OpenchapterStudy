const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    parentPath: {
        type: String,
        required: true,
        default: 'ROOT'
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['folder', 'file'],
        required: true
    },
    // For folders: virtual path is built recursively or stored.
    // Storing full path makes queries easier but updates harder (rename/move).
    // Given the simple requirement, we'll store 'path' to easily build the tree or serve files.
    path: {
        type: String,
        required: true
    },
    // For files: link to GridFS
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fs.files'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique names within a folder
contentSchema.index({ parentPath: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Content', contentSchema);
