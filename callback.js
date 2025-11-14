const express = require("express");
const axios = require("axios"); // để ping lại server
const app = express();

app.use(express.json());

// Callback endpoint
app.post("/api/callback", (req, res) => {
  const {
    partnerKey,
    signature,
    requestedAt,
    transactionCode,
    serialOld,
    serialNew,
    qrCode,
  } = req.body;

  console.log("📥 Received callback data:", req.body);

  if (!partnerKey || !signature) {
    return res.status(400).json({ message: "Missing partnerKey or signature" });
  }

  return res.status(200).json({
    message: "Callback received successfully",
    data: { partnerKey, transactionCode, status: "processed" },
  });
});

// Ping endpoint (keep-alive)
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Run server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Callback API running on port ${PORT}`);
});

// Optional: tự ping chính server mỗi 5 phút để giữ alive
setInterval(() => {
  axios
    .get(`https://callback-a98k.onrender.com/ping`)
    .then(() => console.log("💓 Keep-alive ping sent"))
    .catch((err) => console.error("❌ Keep-alive ping failed:", err.message));
}, 5 * 60 * 1000); // 5 phút
