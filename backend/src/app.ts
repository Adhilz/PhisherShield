
import express from 'express';
import scanRoute from './routes/scan';
import reportRoute from './routes/report'; // <--- NEW: Import report route
import path from 'path'; // For serving static files

require('dotenv').config(); // Load environment variables first

// Initialize Firebase Admin SDK (from firebaseAdmin.ts)
import './firebaseAdmin'; // <--- NEW: Initialize Firebase Admin SDK

// Log environment variables (keep for debugging)
console.log('Environment Variables Loaded:');

console.log('GOOGLE_SAFE_Browse_API_KEY:', process.env.GOOGLE_SAFE_Browse_API_KEY ? 'Loaded' : 'NOT LOADED');
console.log('WHOIS_XML_API_KEY:', process.env.WHOIS_XML_API_KEY ? 'Loaded' : 'NOT LOADED');
console.log('ABUSE_IPDB_API_KEY:', process.env.ABUSE_IPDB_API_KEY ? 'Loaded' : 'NOT LOADED'); // <--- NEW LOG
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'NOT LOADED');

const app = express();
app.use(express.json()); // Enable Express to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // For URL-encoded bodies

// --- NEW: Serve static files for the reporting frontend ---
// This assumes your React reporting app will be built into 'backend/public/report_app_build'
// We'll create this React app and its build process later.
app.use(express.static(path.join(__dirname, '../public/report_app_build')));
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/report_app_build', 'index.html'));
});


// Mount API routes
app.use('/api', scanRoute); // Existing scan route
app.use('/api/report', reportRoute); // <--- NEW: Mount report route

// Start the server
app.listen(4000, () => {
  console.log('Server running on port 4000');
});
