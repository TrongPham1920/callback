const express = require("express");

const app = express();
app.use(express.json()); // parse JSON body

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

  console.log("📥 Received callback data:");
  console.log(req.body);

  // ✅ kiểm tra tối thiểu
  if (!partnerKey || !signature) {
    return res.status(400).json({ message: "Missing partnerKey or signature" });
  }

  // Xử lý nghiệp vụ tại đây, ví dụ xác minh chữ ký, lưu DB, ...
  // Giả sử ok hết:
  return res.status(200).json({
    message: "Callback received successfully",
    data: {
      partnerKey,
      transactionCode,
      status: "processed",
    },
  });
});

// Run server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Callback API running on port ${PORT}`);
});
