// callback.js
import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

app.post("/api/callback", (req, res) => {
  const { partnerKey, signature, transactionCode } = req.body;
  console.log("📥 Received callback:", req.body);
  if (!partnerKey || !signature)
    return res.status(400).json({ message: "Missing partnerKey or signature" });
  res.json({
    message: "Callback received",
    data: { partnerKey, transactionCode, status: "processed" },
  });
});

app.get("/ping", (req, res) => res.send("pong"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Keep-alive ping mỗi 5 phút
setInterval(() => {
  axios
    .get(`http://localhost:${PORT}/ping`)
    .then(() => console.log("💓 Keep-alive ping sent"))
    .catch((err) => console.error("❌ Keep-alive ping failed:", err.message));
}, 5 * 60 * 1000);
