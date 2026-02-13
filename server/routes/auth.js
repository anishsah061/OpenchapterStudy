const express = require('express');
const router = express.Router();

router.post('/verify', (req, res) => {
    const { secret } = req.body;

    if (!secret) {
        return res.status(400).json({ success: false, message: 'Secret code is required' });
    }

    if (secret === process.env.ADMIN_SECRET) {
        return res.json({ success: true, message: 'Authenticated' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid secret code' });
    }
});

module.exports = router;
