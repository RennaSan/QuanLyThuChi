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
[x] 9 Export JSON  [x] 10 Import JSON  [x] 11 Rà soát UX  [x] 12 Sửa theo UX  [ ] 13 Rà soát mã

## Nhật ký
- Khung dự án, tầng lưu trữ và Model/Repository: index.html (Tailwind v4 + DaisyUI v5 CDN), js/config.js, js/storage/storageService.js (load/save, xử lý hỏng/quota), js/models/transaction.js (UUID/thời gian, ISO), js/repositories/transactionRepository.js (CRUD thô, cập nhật updatedAt). Đã kiểm thử lưu trữ an toàn.
- Xây dựng Service nghiệp vụ: js/services/transactionService.js với các hàm thuần không chạm DOM: validate (bắt lỗi amount âm/rỗng/số lẻ, ngày không có thật như 2026-02-30, danh mục sai loại, note > 200 ký tự bằng tiếng Việt), add/update/remove (gọi validate trước khi qua repository), list (lọc theo month, type, category, keyword và sắp xếp theo date giảm dần, cùng ngày thì createdAt giảm dần), summarize (tính totalIncome, totalExpense, balance). Đã kiểm thử trình duyệt: từ chối đúng mọi ca dữ liệu sai và tổng 5 giao dịch mẫu khớp tính tay.
- Hiển thị dữ liệu chỉ đọc: js/views/summaryView.js (3 thẻ stat DaisyUI Tổng thu, Tổng chi, Số dư định dạng vi-VN), js/views/transactionListView.js (bảng ở desktop, thẻ xếp dọc ở mobile, textContent an toàn hiển thị nguyên chữ ghi chú <b>thử</b>, trạng thái "Chưa có giao dịch"), js/controllers/transactionController.js (lấy dữ liệu từ service gọi view), js/app.js (kết nối DOMContentLoaded), vùng nội dung index.html. Đã kiểm thử trình duyệt: service.add 5 giao dịch, F5 tổng số và danh sách khớp chuẩn, 375px không cuộn ngang.
- Form thêm/sửa giao dịch: js/views/transactionFormView.js (modal DaisyUI dùng chung cho Thêm và Sửa, radio loại, số tiền, danh mục đổi động theo loại, ngày mặc định hôm nay, ghi chú, bắt lỗi từ service.validate hiển thị ngay dưới từng trường bằng textContent, điều khiển bàn phím Tab/Enter/Esc), js/views/transactionListView.js (thêm nút Sửa ở bảng desktop và thẻ mobile), js/controllers/transactionController.js (kết nối mở form thêm/sửa, điều phối validate qua service, đóng form và refresh khi lưu thành công), index.html (thêm nút Thêm giao dịch đầu trang và nạp script). Đã kiểm thử trình duyệt: thêm thu/chi, sửa dữ liệu cũ, F5 lưu trữ đúng, chặn lưu khi nhập sai, thao tác bàn phím trơn tru.
- Xóa giao dịch có xác nhận: js/views/deleteConfirmView.js (modal DaisyUI hiển thị ngày, số tiền định dạng vi-VN, danh mục, không dùng confirm() trình duyệt, textContent an toàn), js/views/transactionListView.js (thêm nút Xóa ở bảng desktop và thẻ mobile), js/controllers/transactionController.js (kết nối mở modal xác nhận, gọi service.remove khi đồng ý, đóng modal và cập nhật danh sách/tổng quan; không đổi khi bấm Hủy). Đã kiểm thử trình duyệt: bấm Hủy còn nguyên dữ liệu, bấm Đồng ý xóa thành công và cập nhật tổng quan, F5 dữ liệu vẫn mất chuẩn xác.
- Thanh lọc và tìm kiếm giao dịch: index.html (thêm vùng thanh lọc gồm chọn tháng, loại, danh mục, tìm ghi chú, nút Xóa lọc và nạp script), js/views/filterView.js (quản lý giao diện thanh lọc, dropdown danh mục phụ thuộc động theo loại, debounce tìm kiếm, reset lọc, textContent an toàn), js/controllers/transactionController.js (kết nối FilterView với TransactionService.list(filter), 3 thẻ tổng quan cập nhật theo danh sách đã lọc, hiển thị 'Không có giao dịch phù hợp' khi không có kết quả, không làm đổi dữ liệu đã lưu). Đã kiểm thử bằng tay với 6 giao dịch mẫu: lọc riêng từng tiêu chí, kết hợp, xóa lọc và F5 giữ nguyên dữ liệu đều đạt chuẩn.
- Xuất dữ liệu ra file JSON: index.html (thêm nút Xuất dữ liệu vào #backup-actions trên navbar), js/services/backupService.js (tạo payload export gồm schemaVersion 1, danh sách giao dịch, exportedAt ISO và thụt lề 2 khoảng trắng; sinh tên file thuchi-backup-YYYYMMDD-HHmm.json), js/controllers/backupController.js (xử lý sự kiện click, tạo Blob và thẻ a download tải file, hiển thị toast DaisyUI 'Chưa có dữ liệu để xuất' khi không có giao dịch và không tải file, textContent an toàn).
- Nhập dữ liệu từ JSON có kiểm tra trọn gói: index.html (thêm nút Nhập dữ liệu và input file vào #backup-actions), js/services/backupService.js (thẩm định toàn diện: JSON hợp lệ, schemaVersion 1, transactions là mảng, id duy nhất, createdAt/updatedAt hợp lệ, qua service.validate; ghi đè qua storageService.save bỏ qua exportedAt), js/views/importConfirmView.js (modal DaisyUI hỏi xác nhận 'Thay thế N giao dịch hiện có bằng M giao dịch trong file?'), js/controllers/backupController.js (đọc file qua FileReader, từ chối cả file và hiển thị tối đa 5 lỗi đầu nếu sai, mở modal xác nhận, cập nhật UI và toast tiếng Việt), tạo các file mẫu trong tests/samples/. Đã kiểm thử đủ 5 tiêu chí hoàn thành.
- Rà soát UX toàn diện: Mở ứng dụng trong trình duyệt thực tế ở 375px, 768px, 1440px với 10 giao dịch mẫu. Phát hiện tràn ngang 441px/375px do navbar, modal lệch mép cắt cụt chữ, touch target nút Sửa/Xóa nhỏ (37x24px), tương phản màu xanh/đỏ chưa đạt chuẩn WCAG AA, toast che navbar, nút xóa lọc tablet full-width và bảng tablet ngắt dòng dài. Xuất đầy đủ tài liệu UX_REVIEW.md xếp theo mức Cao/Trung bình/Thấp, không sửa bất kỳ file mã nào.
- Sửa lỗi UX mức Cao: index.html (navbar co giãn không còn tràn ngang 375px, scrollWidth = 375px; text-emerald-700/text-rose-700), js/views/transactionFormView.js (modal-bottom w-11/12 căn giữa không bị cắt lề trái), js/views/transactionListView.js (nút Sửa/Xóa đạt chuẩn touch target 40x58px trên mobile, btn-sm trên tablet/desktop), js/views/summaryView.js (màu tương phản đạt chuẩn WCAG AA > 4.5:1). Đã kiểm thử tự động tại 375px, 768px, 1440px và Export/Import hoạt động chính xác.