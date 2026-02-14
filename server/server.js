const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000; // Default to 8000

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error: ', err.message));

// Routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);

// Serve static files from the React app
const CLIENT_BUILD_PATH = path.join(__dirname, '../client/dist');
app.use(express.static(CLIENT_BUILD_PATH));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    const indexPath = path.join(CLIENT_BUILD_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // In local development (without build), this might happen.
        // It's okay, we just tell the user to use the Client Dev Server.
        res.status(404).send('Client build not found. (If developing locally, use npm run dev in client folder)');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
