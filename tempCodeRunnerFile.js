const http = require('http');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config(); // Load environment variables from .env file

// Initialize Firebase Admin SDK using environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Correctly handle newlines in private key
};
