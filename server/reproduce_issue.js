const fs = require('fs');
const { Blob } = require('buffer');

async function run() {
    console.log("--- Starting Reproduction Script ---");

    // 1. Create a "BadFolder" (folders are created correctly with ROOT prefix usually, let's check)
    // Actually, let's just upload directly to a path "BadFolder" without creating it first 
    // (since upload allows that if we don't strict check folder existence, which the code doesn't seem to)
    // Wait, the code doesn't check if folder exists during upload.

    // Create dummy file
    fs.writeFileSync('repro_test.txt', 'Content does not matter');
    const fileBuffer = fs.readFileSync('repro_test.txt');
    const file = new Blob([fileBuffer], { type: 'text/plain' });

    const folderName = `ReproFolder_${Date.now()}`;
    const fileName = 'repro_test.txt';

    // 2. Upload with path NOT containing ROOT (to simulate the bug)
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('path', folderName); // "Class10" style

    console.log(`Step 1: Uploading file to '${folderName}' (simulating frontend behavior)...`);
    try {
        const uploadRes = await fetch('http://localhost:5000/api/content/upload', {
            method: 'POST',
            headers: { 'x-admin-secret': 'OPEN_CHAPTER_ADMIN_2026' },
            body: formData
        });
        const uploadData = await uploadRes.json();
        console.log('Upload Result:', uploadRes.status, uploadData);
        if (!uploadRes.ok) throw new Error('Upload failed');
    } catch (e) {
        console.error('Setup failed:', e);
        return;
    }

    // 3. Try to Stream (Load) using the path implied by structure (Folder/File)
    // The frontend sends "Folder/File". Backend expects "ROOT/Folder/File".
    const streamPath = `${folderName}/${fileName}`;
    console.log(`Step 2: Attempting to stream from '${streamPath}'...`);
    const streamRes = await fetch(`http://localhost:5000/api/content/stream/${streamPath}`);
    console.log(`Stream Status: ${streamRes.status} (Expected 404/500 if bug exists)`);

    // 4. Try to Delete
    console.log(`Step 3: Attempting to delete '${streamPath}'...`);
    const deleteRes = await fetch('http://localhost:5000/api/content/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': 'OPEN_CHAPTER_ADMIN_2026'
        },
        body: JSON.stringify({ path: streamPath })
    });
    console.log(`Delete Status: ${deleteRes.status} (Expected 404/500 if bug exists)`);
    const deleteData = await deleteRes.json();
    console.log('Delete Response:', deleteData);

    // Cleanup local file
    fs.unlinkSync('repro_test.txt');
}

run();
