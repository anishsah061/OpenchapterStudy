const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error: ', err.message));

// Ensure uploads directory exists - Not needed for GridFS but doesn't hurt to leave if something else uses it
// const UPLOADS_DIR = path.join(__dirname, '../uploads');
// if (!fs.existsSync(UPLOADS_DIR)) {
//     fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

// Routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
