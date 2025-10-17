// Load environment variables from .env file
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
// const { Pool } = require('pg'); // Keep the import, but don't run the connection logic
const cors = require('cors'); 

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CRITICAL: CORS Configuration ---
// Determine the allowed origin dynamically:
// 1. Use RENDER_CLIENT_URL if it's set (this should be set in Render environment settings)
// 2. Fall back to CLIENT_URL from .env (for local testing)
// 3. Fall back to the default localhost URL
const allowedOrigin = process.env.RENDER_CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
    origin: allowedOrigin, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
})); 
app.use(express.json()); // To parse JSON bodies
// --- End CORS Configuration ---


// --- 1. MongoDB Connection (User Data, Logs) ---
// This is critical for Auth, so we must attempt this connection.
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully (or attempting with placeholder URI)'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));


/* // --- 2. PostgreSQL Pool (Static Nutrition Data) ---
// Temporary: We are commenting this block out to prevent the server from crashing 
// on the malformed or placeholder POSTGRES_URI in the .env file.
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

pgPool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// Expose the PG Pool to be used in other routes
// app.set('pgPool', pgPool); 
*/


// --- 3. API Routes ---
app.use('/api/auth', authRoutes); // Authentication routes (Login/Register)
app.use('/api/user', userRoutes);  // User profile routes (GET/PUT profile)

// Basic health check route
app.get('/', (req, res) => {
  res.send('Swasth Bharat API is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Server listening on port ${PORT}`);
  // Use the dynamically determined origin in the console log for clarity
  console.log(`CORS allowing requests from: ${allowedOrigin}`); 
});
