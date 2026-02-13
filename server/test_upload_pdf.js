const { readFileSync, writeFileSync, unlinkSync } = require('fs');
const { Blob } = require('buffer');

// Create dummy file
writeFileSync('test_pdf.txt', 'This simulates a PDF content for testing.');

async function run() {
    const fileBuffer = readFileSync('test_pdf.txt');
    const file = new Blob([fileBuffer], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file, 'test_pdf.txt');
    formData.append('path', 'ROOT/TestPDF');

    try {
        const res = await fetch('http://localhost:5000/api/content/upload', {
            method: 'POST',
            headers: {
                'x-admin-secret': 'OPEN_CHAPTER_ADMIN_2026'
            },
            body: formData
        });
        console.log('Upload Status:', res.status);
        console.log(await res.text());
    } catch (e) {
        console.error(e);
    }
}
run();
