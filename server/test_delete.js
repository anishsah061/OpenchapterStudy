async function run() {
    const filePath = 'ROOT/ValidPDF/valid.pdf';
    console.log(`Attempting to delete: ${filePath}`);

    try {
        const res = await fetch('http://localhost:5000/api/content/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': 'OPEN_CHAPTER_ADMIN_2026'
            },
            body: JSON.stringify({ path: filePath })
        });
        console.log('Delete Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error(e);
    }
}
run();
