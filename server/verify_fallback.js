const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Readable } = require('stream');
const Content = require('./models/Content');

dotenv.config();

async function run() {
    console.log("--- Verifying Fallback Logic ---");

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const conn = mongoose.connection;
    const gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });

    const parentPath = `LegacyFolder_${Date.now()}`;
    const fileName = 'legacy_file.txt';
    const content = 'Legacy content';

    // 1. Manually insert "Bad" data (No ROOT prefix)
    console.log(`Step 1: Inserting legacy data (No ROOT) for '${parentPath}/${fileName}'...`);

    // Upload to GridFS
    const uploadStream = gfsBucket.openUploadStream(fileName);
    const bufferStream = Readable.from(Buffer.from(content));

    await new Promise((resolve, reject) => {
        bufferStream.pipe(uploadStream)
            .on('error', reject)
            .on('finish', resolve);
    });

    const fileId = uploadStream.id;
    console.log(`GridFS File ID: ${fileId}`);

    // Insert Mongo Metadata (Simulating old bug: parentPath has no ROOT)
    const newFile = new Content({
        parentPath: parentPath, // <--- NO ROOT PREFIX
        name: fileName,
        type: 'file',
        path: `${parentPath}/${fileName}`,
        fileId: fileId
    });
    await newFile.save();
    console.log('Legacy metadata saved.');

    // 2. Test Stream Fallback
    console.log(`Step 2: Testing Stream Fallback for '${parentPath}/${fileName}'...`);
    // Frontend sends path without ROOT usually, but let's say it sends "LegacyFolder.../legacy_file.txt"
    const streamRes = await fetch(`http://localhost:5000/api/content/stream/${parentPath}/${fileName}`);
    console.log(`Stream Status: ${streamRes.status}`);
    if (streamRes.ok) {
        console.log("Stream Fallback: SUCCESS");
    } else {
        console.error("Stream Fallback: FAILED");
    }

    // 3. Test Delete Fallback
    console.log(`Step 3: Testing Delete Fallback for '${parentPath}/${fileName}'...`);
    const deleteRes = await fetch('http://localhost:5000/api/content/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': 'OPEN_CHAPTER_ADMIN_2026'
        },
        body: JSON.stringify({ path: `${parentPath}/${fileName}` })
    });
    console.log(`Delete Status: ${deleteRes.status}`);
    const deleteData = await deleteRes.json();
    if (deleteRes.ok) {
        console.log("Delete Fallback: SUCCESS");
    } else {
        console.error("Delete Fallback: FAILED", deleteData);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
