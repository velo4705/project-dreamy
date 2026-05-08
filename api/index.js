module.exports = (req, res) => {
  res.status(200).json({ 
    status: "online", 
    message: "Dreamy API is alive!",
    environment: process.env.NODE_ENV
  });
};