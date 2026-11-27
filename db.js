const mongoose = require('mongoose');

let pending;
// Reuse one connection (important on serverless hosting such as Vercel)
module.exports = function connectDB() {
  if (!pending) {
    pending = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
};
