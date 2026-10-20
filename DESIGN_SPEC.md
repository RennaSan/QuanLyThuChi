# DESIGN_SPEC — Giao diện V2 (phong cách sổ lưu niệm xanh nhạt)
Tham chiếu duy nhất: images/design/mockup.png. Chỉ lấy PHONG CÁCH. Không dùng ảnh này làm nền trang, không chép chữ trong ảnh, không vẽ hay tái tạo nhân vật nào.

## Màu (chữ nhỏ dùng màu tối để đạt tương phản >= 4.5:1)
- Nền trang: gradient từ #F4F8FE sang #E3EDFA, kèm họa tiết chấm bi mờ ở góc (radial-gradient).
- Giấy/thẻ: #FFFFFF, bóng đổ nhẹ rgba(47,93,168,0.15).
- Xanh chính (nút, băng keo, huy hiệu): #4F86D9. KHÔNG dùng làm màu chữ nhỏ trên nền trắng.
- Xanh tiêu đề: #2F5DA8. Chữ thân: #24406F.
- Thu: #0F766E. Chi: #BE123C.
- Viền và đường kẻ: #BFD3EE.

## Chữ (Google Fonts, có tiếng Việt)
- Tiêu đề: Playfair Display, chữ hoa, giãn chữ nhẹ.
- Trang trí (chú thích nhỏ; KHÔNG dùng cho số tiền, nhãn trường, thông báo lỗi): Dancing Script.
- Thân và số: Be Vietnam Pro.

## Họa tiết (chỉ bằng CSS và SVG đơn giản tự viết)
- Polaroid: khung trắng viền dày, đáy dày hơn, nghiêng nhẹ 1–2 độ.
- Băng keo: dải xanh kẻ ca-rô (repeating-linear-gradient), dán nghiêng ở mép trên thẻ.
- Kẹp giấy: SVG đơn giản ở góc modal.
- Khung tem: viền răng cưa dùng cho trạng thái rỗng.
- Sao 4 cánh xanh (SVG) làm điểm nhấn nhỏ.
- Nhãn nhỏ kiểu bookmark có sao ở góc thẻ.
- Chữ xoay dọc ở mép phải trang (chỉ màn >= lg).
- Mọi họa tiết: aria-hidden="true", pointer-events-none, không chứa thông tin.

## Ánh xạ vào ứng dụng
- Header: "QUẢN LÝ THU CHI" kiểu Playfair hoa, gạch mảnh bên dưới, một sao 4 cánh; Polaroid nhỏ (images/avatar.jpg) chỉ hiện khi file tồn tại.
- 3 thẻ tổng quan: 3 Polaroid nghiêng nhẹ, mỗi thẻ một băng keo; số tiền đậm, rõ.
- Thanh lọc: tờ giấy trắng có nhãn dán; nút Xóa lọc dạng viên thuốc.
- Danh sách: tờ giấy trắng, dòng cách nhau bằng đường chấm xanh; mobile dạng thẻ.
- Trạng thái rỗng: khung tem răng cưa.
- Modal: giấy trắng có kẹp giấy và băng keo, bo góc.
- Toast: nhãn dán xanh.

## Ràng buộc
- Giữ nguyên id, data-* và tên hàm công khai trên window.App; chỉ đổi markup, class, CSS.
- Không thêm thư viện ngoài Tailwind, DaisyUI và 3 font trên. CSS tùy biến đặt trong css/scrapbook.css.
- 375px không cuộn ngang (họa tiết nghiêng phải bị cắt bằng overflow-x: clip).
- Vùng chạm >= 40px; focus bàn phím thấy rõ; tương phản chữ >= 4.5:1.
- Tôn trọng prefers-reduced-motion nếu có chuyển động.