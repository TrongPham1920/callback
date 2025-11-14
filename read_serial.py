from PIL import Image
import pytesseract
import re

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

image_path = "1.jpg"
img = Image.open(image_path)
w, h = img.size

rows, cols = 5, 5
cell_w, cell_h = w // cols, h // rows

serials = []

for r in range(rows):
    for c in range(cols):
        # Crop từng SIM
        left = c * cell_w
        top = r * cell_h
        right = left + cell_w
        bottom = top + cell_h

        sim_crop = img.crop((left, top, right, bottom))
        text = pytesseract.image_to_string(sim_crop, lang="eng")
        found = re.findall(r"\d{17,20}", text)
        if found:
            serials.extend(found)

print("Danh sách serial SIM:", serials)
