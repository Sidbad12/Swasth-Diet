// --- BEGIN CORS CONFIGURATION ---
import cors from 'cors'; // <-- Ensure you import 'cors' if using ES modules
// OR: const cors = require('cors'); // <-- If using CommonJS

const allowedOrigins = [
  // This must be the live URL of your Render Static Site (the client)
  "https://swasth-diet-client.onrender.com", 
  // You can keep localhost for local testing
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) or if the origin is in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

// Use the CORS middleware
app.use(cors(corsOptions));

// --- END CORS CONFIGURATION ---
// The rest of your server code follows (e.g., database connection, routes)
