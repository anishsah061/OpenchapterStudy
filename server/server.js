const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000; // Default to 8000 for Koyeb

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint (Vital for Load Balancers)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
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
        console.error(`Client build not found at: ${indexPath}`);
        res.status(500).send('Client build not found. Please verify the build process.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
