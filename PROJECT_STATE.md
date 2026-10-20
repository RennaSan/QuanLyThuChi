# PROJECT_STATE — Web quản lý thu chi (thử nghiệm localStorage)

## Mục tiêu
Web chạy hoàn toàn trên trình duyệt, lưu dữ liệu bằng localStorage. Không backend, không SQL, không cơ sở dữ liệu.

## Quyết định cố định (KHÔNG tự đổi)
- HTML + JavaScript thuần, nạp bằng thẻ <script> thường (KHÔNG dùng ES module, KHÔNG npm, KHÔNG build tool). Mỗi file gắn chức năng vào đối tượng chung `window.App`.
- Giao diện: Tailwind CSS (@tailwindcss/browser@4 v4.3.3) + DaisyUI (daisyui@5 v5.7.50) nạp từ CDN. Không thêm thư viện nào khác. Chỉ dùng class có trong tài liệu chính thức của DaisyUI/Tailwind; không chắc một class thì dùng cách khác, không đoán.
- Mọi chữ hiển thị bằng tiếng Việt. Tiền: VND, số nguyên, định dạng vi-VN. Ngày lưu dạng YYYY-MM-DD.
- Dữ liệu người dùng đưa vào DOM bằng textContent, KHÔNG dùng innerHTML.
- Danh mục cố định (khai báo trong config.js). Chi: Ăn uống, Di chuyển, Nhà ở, Học tập, Giải trí, Sức khỏe, Khác. Thu: Lương, Thưởng, Khác.

## Cấu trúc và chiều phụ thuộc
index.html
js/config.js, js/app.js
js/storage/storageService.js
js/models/transaction.js
js/repositories/transactionRepository.js
js/services/transactionService.js, js/services/backupService.js
js/views/*.js (chỉ vẽ DOM), js/controllers/*.js (nối view với service)
Chiều gọi: view → controller → service → repository → storageService → localStorage. Không nhảy cấp; không gọi localStorage ở ngoài storageService.

## Dữ liệu
Một khóa duy nhất "thuchi.v1":
{ "schemaVersion": 1, "transactions": [ { "id", "type": "income"|"expense", "amount", "category", "date", "note", "createdAt", "updatedAt" } ] }
File export = cấu trúc trên + "exportedAt" (ISO). Import bỏ qua "exportedAt".

## Quy tắc làm việc
- Chỉ làm việc của phiên hiện tại; chỉ tạo/sửa file được liệt kê; không thêm tính năng, file, thư viện ngoài danh sách.
- Sửa tại chỗ bằng thay đổi nhỏ, KHÔNG viết lại cả file đang chạy tốt.
- Hỏi tôi trước khi xóa file hoặc đổi cấu trúc thư mục.
- Phải chạy thử thật bằng trình duyệt trước khi báo xong.
- Cuối phiên: tích mục trong "Danh sách việc", thêm 1–3 dòng vào "Nhật ký" (tối đa 10 dòng, gộp dòng cũ), rồi báo cáo đúng mẫu:
  ✅ Đã làm: … / 📁 File đổi: … / ⚠ Tồn đọng: …
- Dừng khi đạt tiêu chí hoàn thành, không tự làm việc kế tiếp.

## Danh sách việc
[x] 1 Khung dự án  [x] 2 Cấu hình và lưu trữ  [x] 3 Model và Repository  [x] 4 Service
[x] 5 Danh sách và tổng quan  [x] 6 Form thêm/sửa  [x] 7 Xóa  [x] 8 Lọc và tìm
[x] 9 Export JSON  [x] 10 Import JSON  [x] 11 Rà soát UX  [x] 12 Sửa theo UX  [x] 13 Rà soát mã

## Nhật ký
- Giai đoạn 1 — Nghiệp vụ, UX & Rà soát mã (Phiên 1–13): Hoàn thiện kiến trúc MVC thuần, storageService an toàn, CRUD giao dịch, bộ lọc, sao lưu JSON, thẩm định tiếng Việt, chuẩn a11y và tuyệt đối không innerHTML.
- Giai đoạn 2 — Nền, thẻ, lọc & danh sách (D1–D4): Google Fonts, css/scrapbook.css, 3 thẻ Polaroid, thanh lọc tờ giấy có nhãn dán, danh sách đường chấm xanh (thẻ mobile / bảng desktop lg), khung tem rỗng.
- Giai đoạn 2 — Ba modal & Toast (D5–D6): 3 modal giấy trắng kèm kẹp SVG và băng keo ca-rô, nút đóng >= 40px; Toast nhãn dán xanh đổi vị trí linh hoạt (dưới ở mobile, trên phải ở desktop); chữ xoay dọc mép phải "THU CHI".
- Giai đoạn 2 — Rà soát toàn diện giao diện (D7): Chuẩn hóa tính nhất quán màu/chữ/họa tiết; responsive 375px/768px/1440px; tương phản WCAG AA; focus bàn phím rõ nét (:focus-visible); vùng chạm mọi nút >= 40px; toàn bộ họa tiết đã aria-hidden="true" và pointer-events-none; 0 innerHTML với dữ liệu; khử CSS thừa.

## GIAI ĐOẠN 2 — Thiết kế lại giao diện (chức năng đã xong, KHÔNG đổi logic)
- Phạm vi: chỉ phần view. Cấm sửa js/storage, js/models, js/repositories, js/services và logic trong js/controllers (riêng backupController.js chỉ được sửa markup/class của toast).
- Đọc DESIGN_SPEC.md trước mỗi phiên.
- Ngoại lệ so với "Quyết định cố định": được thêm Google Fonts (Playfair Display, Dancing Script, Be Vietnam Pro) và file css/scrapbook.css.
- Kiểm tra: KHÔNG dùng browser agent hay script tự động. Cuối phiên đưa tôi các bước kiểm tra bằng tay (375px, 768px, 1440px), chờ tôi báo kết quả rồi mới tích mục.
- images/design/mockup.png chỉ để đọc, không sửa ảnh trong images/.
- Không tạo file test hay file tạm trong dự án.

## Danh sách việc — Giai đoạn 2
[x] D1 Nền, chữ, header  [x] D2 Thẻ tổng quan  [x] D3 Thanh lọc  [x] D4 Danh sách và trạng thái rỗng
[x] D5 Ba modal  [x] D6 Toast và chi tiết  [x] D7 Rà soát