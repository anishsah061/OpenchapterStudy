const fs = require('fs');

async function run() {
    try {
        console.log('Fetching structure...');
        const structRes = await fetch('http://localhost:5000/api/content/structure');
        const structure = await structRes.json();
        console.log('Structure:', JSON.stringify(structure, null, 2));

        // Find a file to download
        // Helper to find first file
        const findFile = (nodes) => {
            for (const node of nodes) {
                if (node.type === 'file') return node;
                if (node.children) {
                    const found = findFile(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const fileNode = findFile(structure);
        if (!fileNode) {
            console.log('No file found to test download.');
            return;
        }

        console.log(`Attempting to download: ${fileNode.path}`);
        // The path in structure is "ROOT/Test/test_file.txt". 
        // The route is /stream/Test/test_file.txt (if ROOT is implicit) OR /stream/ROOT/Test/test_file.txt
        // efficient way: just try the path property from the structure.

        // The frontend likely passes the path excluding ROOT if it treats ROOT as invisible, or includes it.
        // Let's try with the path from the structure.
        // structure path: "ROOT/Test/test_file.txt"
        // Route handles: /stream/:path* -> regex match. 
        // If I request /api/content/stream/ROOT/Test/test_file.txt, virtualPath will be ROOT/Test/test_file.txt

        const encodedPath = encodeURIComponent(fileNode.path);
        // Note: encodeURIComponent encodes /, so we might need to verify how frontend sends it.
        // Usually, path params in express with regex match unencoded slashes if not encoded.
        // But here we are using a regex route. params[0] captures the rest.

        const url = `http://localhost:5000/api/content/stream/${fileNode.path}`;
        console.log(`URL: ${url}`);

        const downloadRes = await fetch(url);
        console.log('Download Status:', downloadRes.status);

        if (downloadRes.ok) {
            const text = await downloadRes.text();
            console.log('File Content Preview:', text.substring(0, 100));
        } else {
            console.log('Error:', await downloadRes.text());
        }

    } catch (e) {
        console.error(e);
    }
}
run();
