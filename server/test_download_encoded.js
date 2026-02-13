const { writeFileSync, unlinkSync } = require('fs');

async function run() {
    // Valid PDF path
    const filePath = 'ROOT/ValidPDF/valid.pdf';
    const encodedPath = encodeURIComponent(filePath);

    // Frontend URL structure
    const url = `http://localhost:5000/api/content/stream/${encodedPath}`;
    console.log(`Testing URL: ${url}`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            console.log("Download Success");
            const text = await res.text();
            console.log("Preview: " + text.substring(0, 50));
        } else {
            console.log("Error: " + await res.text());
        }
    } catch (e) {
        console.error(e);
    }
}
run();
