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
- Khung dự án và nền tảng lưu trữ (Phiên 1–3): index.html (Tailwind v4 + DaisyUI v5 CDN), js/config.js, js/storage/storageService.js (load/save an toàn, khôi phục JSON hỏng), js/models/transaction.js (UUID/ISO), js/repositories/transactionRepository.js (CRUD thô qua storageService).
- Nghiệp vụ giao dịch (Phiên 4): js/services/transactionService.js hàm thuần không chạm DOM (validate tiếng Việt bắt lỗi âm/rỗng/số lẻ/2026-02-30/sai danh mục, add/update/remove qua repository, list lọc theo tháng/loại/danh mục/từ khóa, summarize tính thu/chi/dư).
- Giao diện và điều khiển (Phiên 5–8): summaryView.js (3 thẻ stat vi-VN), transactionListView.js (responsive bảng desktop / thẻ mobile), transactionFormView.js (modal thêm/sửa, bắt lỗi từng trường), deleteConfirmView.js (modal xác nhận xóa), filterView.js (thanh lọc đa tiêu chí), transactionController.js điều phối dữ liệu.
- Sao lưu và phục hồi JSON (Phiên 9–10): backupService.js, backupController.js, importConfirmView.js. Thẩm định trọn gói schemaVersion 1, transactions mảng, id/createdAt/updatedAt hợp lệ; hộp thoại xác nhận số lượng; xuất Blob/download, nạp FileReader, hiển thị Toast an toàn bằng textContent.
- Đánh giá và tối ưu UX (Phiên 11–12): Triệt tiêu lỗi tràn ngang màn hình 375px trên navbar, sửa lỗi modal co giãn căn giữa không bị cắt lề trái, tăng touch target nút Sửa/Xóa đạt chuẩn (40x58px), nâng độ tương phản màu số tiền đạt chuẩn WCAG AA (> 4.5:1).
- Rà soát mã toàn diện (Phiên 13): Rà soát từng file theo đúng thứ tự storage → repository → service → controller → view. Sửa triệt để vi phạm chiều gọi (loại bỏ nạp script động bằng DOM trong service/controller, khai báo đủ script trong index.html, khởi tạo tập trung tại app.js); khử mã trùng lặp (dùng chung formatCurrency và getCategories qua window.App, gộp xử lý sao lưu dữ liệu hỏng trong storageService); chuyển logic thông báo empty state từ controller về view; khử nguy cơ thừa trường khi lưu dữ liệu; bổ sung đầy đủ nhãn a11y (aria-label, role dialog, aria-labelledby, aria-describedby). Chạy lại toàn bộ kiểm tra Prompt 3, 4 và vòng xuất → xóa → nhập Prompt 10 đều đạt chuẩn.