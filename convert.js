const fs = require("fs");
const XLSX = require("xlsx");

// 1️⃣ Đọc file SQL gốc
const sqlFile = fs.readFileSync("data.sql", "utf8");

// 2️⃣ Tách từng dòng có INSERT
const lines = sqlFile
  .split("\n")
  .filter((line) => line.includes("INSERT INTO"));

// 3️⃣ Lấy giá trị trong VALUES(...)
const rows = lines
  .map((line) => {
    const match = line.match(/\(([^)]+)\)/);
    if (!match) return null;

    // Tách các phần tử trong VALUES
    return match[1].split(",").map((v) => v.trim().replace(/^'|'$/g, "")); // loại bỏ dấu nháy đơn
  })
  .filter(Boolean);

// 4️⃣ Tạo workbook Excel
const ws = XLSX.utils.aoa_to_sheet([["ICCID", "SĐT", "Mã Gói"], ...rows]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "sim_kit");

// 5️⃣ Xuất ra file Excel
XLSX.writeFile(wb, "sim_kit.xlsx");

console.log("✅ Xuất file sim_kit.xlsx thành công!");
