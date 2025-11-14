const XLSX = require("xlsx");
const dayjs = require("dayjs");
const axios = require("axios");

const urlLogin = "https://smkapi.minhkhang.tech/api/v1/auth/login";
const urlApi =
  "https://smkapi.minhkhang.tech/api/v1/sim-kit/flow/register/transactions";

const phone_number = "0915374450";
const password = "123123";
const LIMIT = 500;
const from_date = "01/09/2025";
const to_date = "24/09/2025";
const status = "REJECT";

async function run() {
  try {
    // ===== 1. Login để lấy token =====
    const loginRes = await axios.post(urlLogin, {
      phone_number: phone_number,
      password: password,
    });

    const token = loginRes.data?.data?.access_token;
    if (!token) {
      console.error("❌ Không lấy được token");
      return;
    }

    // ===== 2. Lấy trang đầu tiên để biết tổng =====
    const firstRes = await axios.get(
      `${urlApi}?page=0&limit=${LIMIT}&status=${status}&from_date=${from_date}&to_date=${to_date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const payload = firstRes.data.data;
    const total = payload.pagination.total;
    console.log("✅ Tổng số bản ghi:", total);

    // Lưu toàn bộ items
    let allItems = [...payload.items];

    // Tính số lần gọi thêm
    const totalPages = Math.ceil(total / LIMIT);

    // Lấy dữ liệu các trang tiếp theo
    for (let page = 1; page < totalPages; page++) {
      const res = await axios.get(
        `${urlApi}?page=${page}&limit=${LIMIT}&status=${status}&from_date=${from_date}&to_date=${to_date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      allItems = allItems.concat(res.data.data.items);
      console.log(`✅ Lấy xong trang ${page + 1}/${totalPages}`);
    }

    // ===== 3. Ánh xạ dữ liệu chi tiết =====
    const mappedData = allItems.map((item, index) => ({
      STT: index + 1,
      "Số thuê bao": item.phone_number,
      "Trạng thái": item.note,
      Ngày: item.created_at ? dayjs(item.created_at).format("DD/MM/YYYY") : "",
    }));

    // ===== 4. Sheet 1: Chi tiết =====
    const ws1 = XLSX.utils.json_to_sheet(mappedData);

    // ===== 5. Xử lý thống kê lỗi =====
    const errorSolutions = {
      // Hệ thống
      "Đang thực hiện": "Hủy Đơn treo",
      "Đã hủy": "Hủy đơn tay hoặc hệ thống tự hủy sau 2 - 7 tiếng",
      "Đã hủy do quá thời gian":
        "Hệ thống tự động hủy 5 - 15 phút vì quá hạn xử lý",

      // Xác nhận thông tin
      "Lỗi xác nhận thông tin: Số CCCD/CMND":
        "Hủy web mới, dkttb lại web phattai sau khi thử 3 lần không được báo vinatti xóa task và dkttb lại web mới",
      "Lỗi xác nhận thông tin: Số CCCD/CMND đã đăng ký 3 thuê bao":
        "Nhập tay lại cccd , thông tin cccd mới, Hủy web mới, dkttb lại web phattai sau khi thử 3 lần không được báo vinatti xóa task và dkttb lại web mới",
      "Lỗi xác nhận thông tin: Trạng thái không hợp lệ":
        "Hủy web mới, dkttb lại web phattai sau khi thử 3 lần không được báo vinatti xóa task và dkttb lại web mới",
      "Lỗi xác nhận thông tin: Địa chỉ thường trú không hợp lệ":
        "Khi vào màn hình xác nhận bên web mới, kiểm tra lại địa chỉ thường trú có đúng không, nếu đúng thì nhập tay lại địa chỉ thường trú, Hủy web mới, dkttb lại web phattai sau khi thử 3 lần không được báo vinatti xóa task và dkttb lại web mới",
      "Lỗi xác nhận thông tin: Ngày sinh không hợp lệ":
        "Hủy web mới, dkttb lại web phattai sau khi thử 3 lần không được báo vinatti xóa task và dkttb lại web mới, trường hợp hiếm chỉ xảy ra khi ngay sinh 01/01/1970",
      "Lỗi xác nhận thông tin: Thao tác quá nhanh! Thử lại sau 5 giây":
        "Thử lại web cũ ...",

      // Đăng ký sim
      "Lỗi đăng ký sim: Không tồn tại dữ liệu":
        "Sim đã được pick từ hệ thống khác ,nếu k xử lý dc vinatti treo đơn 7 tiếng",
      "Lỗi đăng ký sim: HTTPSConnectionPool (NameResolutionError)":
        "Lỗi kết nối qua vinatti thử lại sau 5-10 phút, sau đó thử lại web cũ phattai",
      "Lỗi đăng ký sim: 504 Server Error: Gateway Time-out":
        "Lỗi kết nối qua vinatti thử lại sau 5-10 phút, sau đó thử lại web cũ phattai",
      "Lỗi đăng ký sim: Số thuê bao đã được đăng ký. Vui lòng chọn số thuê bao khác để đăng ký":
        "Báo vinatti xóa task và dkttb lại web mới",
      "Lỗi đăng ký sim: Bạn không có quyền truy cập Số thuê bao.Vui lòng liên hệ bộ phận Kinh doanh để được hỗ trợ":
        "Báo vinatti xóa task và dkttb lại web mới",

      // Tạo hợp đồng
      "Lỗi tạo hợp đồng: HTTPSConnectionPool (NameResolutionError)":
        "Lỗi kết nối qua vinatti thử lại sau 5-10 phút, sau đó thử lại web cũ phattai",

      // Upload giấy tờ
      "Lỗi upload giấy tờ: Giấy tờ đã hết hạn, vui lòng thử lại":
        "Upload giấy tờ mới, nếu vẫn lỗi thì hủy web mới, dkttb lại web phattai sau khi thử 3 lần không được báo vinatti xóa task và dkttb lại web mới",
      "Lỗi upload giấy tờ: Không thể đọc được thông tin giấy tờ mặt trước, vui lòng thử lại":
        "Nếu là căn cước phải chọn loại giấy tờ là CCCD, chỉ dk web mới, lưu ý ảnh hồ sơ phải rõ nét, không bị mờ, chói sáng, phản quang",
      "Lỗi upload giấy tờ: Mặt sau và mặt trước giấy tờ không cùng loại, vui lòng thử lại":
        "Nếu là căn cước phải chọn loại giấy tờ là CCCD, chỉ dk web mới, lưu ý ảnh hồ sơ phải rõ nét, không bị mờ, chói sáng, phản quang",
      "Lỗi upload giấy tờ: Đã có lỗi xảy ra vui lòng thử lại sau #5":
        "Nếu là căn cước phải chọn loại giấy tờ là CCCD, chỉ dk web mới, lưu ý ảnh hồ sơ phải rõ nét, không bị mờ, chói sáng, phản quang",
      "Lỗi upload giấy tờ: 504 Server Error: Gateway Time-out":
        "Lỗi kết nối qua vinatti thử lại sau 5-10 phút, sau đó thử lại web cũ phattai",

      // Nạp kit
      "Lỗi nạp kit: Serial không trùng khớp với bộ kit":
        "Lỗi chỉ xảy ra khi số simkit bị nhập sai serial, nhập lại đúng serial",
      "Lỗi nạp kit: 504 Server Error: Gateway Time-out":
        "Lỗi kết nối qua vinatti thử lại sau 5-10 phút, sau đó thử lại web cũ phattai",
      "Lỗi nạp kit: Đã có lỗi xảy ra vui lòng thử lại sau #5":
        "Báo vinatti xóa task và dkttb lại web mới",

      // Tải ảnh chữ ký
      "Lỗi tải ảnh chữ ký: Lỗi hệ thống, vui lòng liên hệ quản trị":
        "Báo vinatti xóa task và dkttb lại web mới",
      "Lỗi tải ảnh chữ ký: connect ECONNREFUSED 10.10.230.104:8000":
        "Báo vinatti xóa task và dkttb lại web mới",

      // Confirm Ekyc
      "Lỗi xác nhận thông tin: HTTPSConnectionPool (NameResolutionError)":
        "Lỗi kết nối qua vinatti thử lại sau 5-10 phút, sau đó thử lại web cũ phattai",
    };

    const errorMap = {};

    allItems.forEach((item) => {
      let note = item.note;
      let loaiLoi = "Vinatti";

      // Xử lý các lỗi hệ thống
      if (
        note === "Đã hủy" ||
        note === "Đã hủy do quá thời gian" ||
        note === "Đang thực hiện"
      ) {
        loaiLoi = "Hệ thống";
      } else {
        // Loại bỏ các hậu tố như (Đã hủy do quá thời gian) hoặc các cụm tương tự
        note = note.replace(/\(Đã hủy do quá thời gian\)/, "").trim();
        note = note
          .replace(/, yêu cầu không thể tiếp tục thực hiện\./, "")
          .trim();
        note = note.replace(/Số CCCD\/CMND\s+\d+/, "Số CCCD/CMND");
        note = note.replace(/Số thuê bao\s+\d+/, "Số thuê bao");

        // Gom nhóm lỗi HTTPSConnectionPool
        if (
          note.includes("HTTPSConnectionPool") &&
          note.includes("NameResolutionError")
        ) {
          if (note.includes("RegisterMobile"))
            note = "Lỗi đăng ký sim: HTTPSConnectionPool (NameResolutionError)";
          else if (note.includes("FillForm"))
            note =
              "Lỗi tạo hợp đồng: HTTPSConnectionPool (NameResolutionError)";
          else if (note.includes("ConfirmEkyc"))
            note =
              "Lỗi xác nhận thông tin: HTTPSConnectionPool (NameResolutionError)";
        }

        // Gom nhóm lỗi timeout
        if (note.includes("504 Server Error")) {
          if (note.includes("RegisterMobile"))
            note = "Lỗi đăng ký sim: 504 Server Error: Gateway Time-out";
          else if (note.includes("AddKit"))
            note = "Lỗi nạp kit: 504 Server Error: Gateway Time-out";
          else if (note.includes("CardEkyc"))
            note = "Lỗi upload giấy tờ: 504 Server Error: Gateway Time-out";
        }
      }

      const key = loaiLoi + "|" + note;
      if (!errorMap[key]) {
        let solution = errorSolutions[note];
        // Fallback logic for undefined errors
        if (!solution) {
          if (note.startsWith("Lỗi đăng ký sim")) {
            solution = "Báo vinatti xóa task và dkttb lại web mới";
          } else if (note.startsWith("Lỗi xác nhận thông tin")) {
            solution = "Thử lại web cũ ...";
          } else if (note.startsWith("Lỗi tải ảnh chữ ký")) {
            solution = "Báo vinatti xóa task và dkttb lại web mới";
          } else {
            solution = "Chưa có cách xử lý, cần bổ sung";
          }
        }
        errorMap[key] = {
          loaiLoi,
          note,
          count: 0,
          solution,
        };
      }
      errorMap[key].count++;
    });

    // ===== 5. Sheet 2: Thống kê lỗi =====
    const summary = Object.values(errorMap).map((item, index) => ({
      STT: index + 1,
      "Loại lỗi": item.loaiLoi,
      "Tên lỗi": item.note,
      "Số lần xuất hiện": item.count,
      "Cách xử lý": item.solution,
    }));

    // Định nghĩa ws2
    const ws2 = XLSX.utils.json_to_sheet(summary);

    // ===== 6. Xuất file Excel =====
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Chi tiết");
    XLSX.utils.book_append_sheet(wb, ws2, "Thống kê lỗi");

    const fileName = `ket_qua_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    XLSX.writeFile(wb, fileName);

    console.log("✅ Xuất file thành công:", fileName);
  } catch (err) {
    console.error("❌ Lỗi:", err.response?.data || err.message);
  }
}

run();
