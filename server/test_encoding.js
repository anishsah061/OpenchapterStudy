const fs = require('fs');
const { Blob } = require('buffer');

async function run() {
    console.log("--- Testing Frontend-Style Encoding ---");

    // 1. Upload a file to ensure we have something to test
    const fileName = 'encoding_test.txt';
    const folderName = 'EncodingTest';
    fs.writeFileSync(fileName, 'Test content');
    const file = new Blob([fs.readFileSync(fileName)], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('path', folderName);

    try {
        await fetch('http://localhost:5000/api/content/upload', {
            method: 'POST',
            headers: { 'x-admin-secret': 'OPEN_CHAPTER_ADMIN_2026' },
            body: formData
        });
    } catch (e) {
        console.error('Upload failed', e);
        return;
    }

    // Path in DB should be "ROOT/EncodingTest/encoding_test.txt"
    const dbPath = `ROOT/${folderName}/${fileName}`;

    // 2. Simulate Frontend Request using encodeURIComponent (encodes slashes)
    const frontendPath = encodeURIComponent(dbPath);
    console.log(`DB Path: ${dbPath}`);
    console.log(`Frontend Path (Full Encode): ${frontendPath}`);

    const url = `http://localhost:5000/api/content/stream/${frontendPath}`;
    console.log(`Requesting: ${url}`);

    const res = await fetch(url);
    console.log(`Status with encodeURIComponent: ${res.status}`); // Expect 404 if bug exists

    if (res.status === 404) {
        console.log("BUG CONFIRMED: Backend splits by slash, but slashes are encoded!");
    } else {
        console.log("It worked? Backend must be decoding automatically.");
    }

    // 3. Test with encodeURI (preserves slashes) for comparison
    const betterPath = encodeURI(dbPath); // OR split/join
    console.log(`Frontend Path (encodeURI): ${betterPath}`);
    const res2 = await fetch(`http://localhost:5000/api/content/stream/${betterPath}`);
    console.log(`Status with encodeURI: ${res2.status}`);

    fs.unlinkSync(fileName);
}

run();
