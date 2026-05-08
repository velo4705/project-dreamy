const app = require("../server/index");

// This ensures Vercel treats this as a single serverless function 
// that handles all /api/* routes.
module.exports = app;