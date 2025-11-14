import pandas as pd

# Đường dẫn file gốc
file_path = "mbbank 260925.xlsx"   # nhớ để file gốc cùng thư mục

# Đọc dữ liệu, không có header
df = pd.read_excel(file_path, sheet_name="Sheet1", header=None)

# Gán tên cột
df.columns = ["So", "Gia", "Loai"]

# Chuẩn hóa số điện thoại: bỏ dấu chấm và để dạng text
df["So"] = df["So"].astype(str).str.replace(".", "", regex=False)

# Chuyển giá tiền thành số để sắp xếp
df["Gia_num"] = pd.to_numeric(df["Gia"], errors="coerce")

# Chuyển lại giá tiền sang text để xuất Excel
df["Gia"] = df["Gia"].astype(str)

# Log số dòng file gốc (toàn bộ dữ liệu)
tong_goc = len(df)
print(f"📌 Tổng số dòng file gốc: {tong_goc}")

# Lấy danh sách loại
loai_khac_nhau = df["Loai"].unique().tolist()

# Xuất ra file Excel mới
output_path = "mbbank_by_loai.xlsx"
tong_moi = 0
with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
    for loai in loai_khac_nhau:
        temp_df = df[df["Loai"] == loai].copy()
        # Sắp xếp theo giá
        temp_df = temp_df.sort_values(by="Gia_num", ascending=True)
        # Xuất sheet
        temp_df[["So", "Gia", "Loai"]].to_excel(writer, sheet_name=loai[:30], index=False)
        # Log số dòng từng sheet
        so_dong = len(temp_df)
        tong_moi += so_dong
        print(f"   - Sheet '{loai}': {so_dong} dòng")

print(f"✅ Đã tạo file: {output_path}")
print(f"📊 Tổng số dòng sau khi tách: {tong_moi}")

# Kiểm tra khớp
if tong_goc == tong_moi:
    print("👍 Số dòng dữ liệu KHỚP 100% với file gốc!")
else:
    print("⚠️ Số dòng KHÔNG khớp, cần kiểm tra lại!")
