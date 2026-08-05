const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configurations
app.use(cors());
app.use(express.json());


// Database Connection Logic
// Attempt to connect to MongoDB. If it fails, log the error but continue running.
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/captrack';
mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => {
    console.error('⚠️  MongoDB connection failed. The server will run without a database:', err.message);
    // Proceed without a DB – routes that depend on mongoose will need proper handling.
  });

    // Routes configuration tracking
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/activity', require('./routes/activity'));
 
// Primary testing route
app.get('/', (req, res) => {
    res.send('CapTrack Easy Backend Server Operational and Running perfectly!');
});

// App server listener
app.listen(PORT, () => {
    console.log(`Server is currently running on gateway endpoint: http://localhost:${PORT}`);
});


