import axios from "axios";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const urlLogin = "https://smkapi.minhkhang.tech/api/v1/auth/login";
const urlApi = "https://smkapi.minhkhang.tech/api/v1/wallet/requests";

const LIMIT = 100;
const from_date = "01/10/2025";
const to_date = "24/10/2025";
const phone_number = "0915374450";
const password = "123123";

async function run() {
  try {
    // ===== 1. Login để lấy token =====
    const loginRes = await axios.post(urlLogin, {
      phone_number,
      password,
    });

    const token = loginRes.data?.data?.access_token;
    if (!token) {
      console.error("❌ Không lấy được token");
      return;
    }

    // ===== 2. Lấy trang đầu tiên để biết tổng =====
    const firstRes = await axios.get(
      `${urlApi}?page=0&limit=${LIMIT}&from_date=${from_date}&to_date=${to_date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const payload = firstRes.data.data;
    const total = payload.pagination.total;
    console.log("✅ Tổng số bản ghi:", total);

    let allItems = [...payload.items];
    const totalPages = Math.ceil(total / LIMIT);

    // ===== 3. Lấy tất cả dữ liệu =====
    for (let page = 1; page < totalPages; page++) {
      const res = await axios.get(
        `${urlApi}?page=${page}&limit=${LIMIT}&from_date=${from_date}&to_date=${to_date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      allItems = allItems.concat(res.data.data.items);
      console.log(`✅ Lấy xong trang ${page + 1}/${totalPages}`);
    }

    // ===== 4. Lọc các bản ghi có type = 0 =====ßßß
    const filteredItems = allItems.filter(
      (item) => item.type === 0 && item.status !== 0
    );
    console.log(`✅ Tổng số bản ghi type=0: ${filteredItems.length}`);

    // ===== 5. Ánh xạ dữ liệu =====

    const mapStatus = (status) => {
      switch (status) {
        case 1:
          return "Đã duyệt";
        case 2:
          return "Từ chối";
        case 0:
        default:
          return "Đang xử lý";
      }
    };

    const mappedData = filteredItems.map((item, index) => ({
      STT: index + 1,
      "Mã đơn": item.code || "",
      "Cửa hàng": item.store || item.agency_name || "",
      "Số tiền": item.amount || 0,
      "Trạng thái": mapStatus(item.status),
      "Thời gian tạo giao dịch": item.created_at
        ? dayjs(item.created_at).format("DD/MM/YYYY HH:mm:ss")
        : "",
    }));

    // ===== 6. Xuất file Excel =====
    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách type=0");

    const fileName = `wallet_type0_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    console.log(`✅ File Excel đã được tạo: ${fileName}`);
  } catch (err) {
    console.error("❌ Lỗi:", err.response?.data || err.message);
  }
}

run();
