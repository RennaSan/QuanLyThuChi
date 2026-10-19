# Báo cáo Đánh giá Giao diện & Trải nghiệm Người dùng (UX Review)

> **Dự án**: Web quản lý thu chi cá nhân (LocalStorage)  
> **Phiên thực hiện**: Phiên 11 — Rà soát UX  
> **Môi trường thử nghiệm**: Trình duyệt Chromium/Edge Headless thực tế với 10 giao dịch mẫu (thu/chi, số tiền từ 50.000 ₫ đến 25.000.000 ₫, ghi chú ngắn và dài).  
> **Kích thước kiểm thử tiêu chuẩn**: **375px × 667px** (Mobile), **768px × 1024px** (Tablet), **1440px × 900px** (Desktop).  
> **Mục tiêu**: Đánh giá toàn diện điều hướng, bố cục, phân cấp thị giác, độ dễ đọc, nút hành động chính, khả năng tiếp cận (a11y) và độ tiện dùng trên di động mà **KHÔNG sửa mã nguồn** trong phiên này.

---

## 1. Bảng Xếp Hạng Vấn Đề Theo Mức Tác Động (Cao / Trung bình / Thấp)

| STT | Mức tác động | Trạng thái | Vấn đề UX / UI | Kích thước phát hiện | Cách sửa cụ thể (thực hiện ở Phiên 12) | File liên quan |
| :---: | :---: | :---: | :--- | :---: | :--- | :--- |
| **01** | **Cao** | **[x] Đã sửa** | **Tràn ngang toàn trang (Horizontal Overflow 441px/375px)** do hàng nút trên Navbar không co giãn/xuống dòng, nút "Xuất dữ liệu" bị cắt mất 66px ra ngoài màn hình. | **375px** (Mobile) | Tại `navbar-end` trên mobile: thu nhỏ padding `px-2`, gom 2 nút Nhập/Xuất thành icon button có tooltip/aria-label; chỉ hiển thị chữ đầy đủ từ breakpoint `sm:`. | `index.html` |
| **02** | **Cao** | **[x] Đã sửa** | **Modal "Thêm giao dịch" bị tràn màn hình và cắt cụt chữ mép trái** ("hêm", "oại", "ố tiền", "anh mục", "gày", "hi chú") do `modal-box` rộng 421px so với 375px. | **375px** (Mobile) | Thay class `modal-box max-w-md w-full p-6` bằng `modal-box w-11/12 max-w-md p-4 sm:p-6 mx-auto`; thêm `modal-bottom sm:modal-middle` để mobile hiển thị dạng bottom sheet chuẩn tiện dụng ngón tay cái. | `js/views/transactionFormView.js` |
| **03** | **Cao** | **[x] Đã sửa** | **Vùng chạm (Touch Target) của nút Sửa/Xóa trên Mobile quá nhỏ (37px × 24px, chuẩn ≥ 44px)** và đặt sát nhau (gap 6px), nguy cơ bấm nhầm rất cao. | **375px**, **768px** (Mobile & Tablet) | Tăng kích thước nút lên `btn-md` (40px × 58px) trên mobile và `btn-sm` (32px × 46px) trên tablet/desktop, giãn cách `gap-2 sm:gap-3` để chống bấm nhầm. | `js/views/transactionListView.js` |
| **04** | **Cao** | **[x] Đã sửa** | **Độ tương phản màu số tiền Thu (`text-success`), Chi (`text-error`) không đạt chuẩn WCAG AA** (chỉ đạt 1.88:1 và 2.4:1 trên nền trắng, chuẩn yêu cầu ≥ 4.5:1). | **375px**, **768px**, **1440px** (Toàn bộ) | Thay `text-success` bằng màu xanh lục đậm `text-emerald-700` (tương phản > 4.5:1); thay `text-error` bằng `text-rose-700`. | `js/views/summaryView.js`, `js/views/transactionListView.js`, `index.html` |
| **05** | **Trung bình** | [ ] Chưa sửa | **Thông báo Toast che phủ hoàn toàn Navbar Header** và tràn mép phải màn hình 375px khi thông báo lỗi hoặc xác nhận. | **375px** (Mobile) | Đổi vị trí toast thành `toast-bottom toast-center sm:toast-top sm:toast-end` với `w-full max-w-sm px-4`; thêm nút đóng "✕" thủ công để không chắn vùng thao tác của người dùng. | `js/controllers/backupController.js` |
| **06** | **Trung bình** | [ ] Chưa sửa | **Cột "Ghi chú" trên bảng Tablet (768px) bị ép hẹp khiến chữ ngắt 4–5 dòng**, làm chiều cao hàng tăng vọt (> 120px) và bảng bị vỡ nhịp điệu đọc. | **768px** (Tablet) | Thêm `max-w-xs truncate` (hoặc `line-clamp-2`) kèm `title="..."` hiển thị đầy đủ khi hover; hoặc giữ chế độ card mobile cho tới breakpoint `lg:` (1024px) thay vì chuyển sang bảng ở `md:` (768px). | `js/views/transactionListView.js` |
| **07** | **Trung bình** | [ ] Chưa sửa | **Nút "Xóa lọc" ở Tablet (768px) bị kéo giãn full-width thành thanh ngang khổng lồ** (`sm:col-span-2`), gây lệch phân cấp thị giác so với các input. | **768px** (Tablet) | Thay vì để nút kéo dãn 100% cột thứ 3, đổi container thành `sm:col-span-2 flex justify-end` và nút có độ rộng tự nhiên `w-auto px-6` để tạo sự gọn gàng, tinh tế. | `index.html` |
| **08** | **Trung bình** | [ ] Chưa sửa | **Modal Xác nhận xóa bị tràn sát mép phải màn hình 375px**, chữ trên nút "Xác nhận xóa" bị chạm mép viền. | **375px** (Mobile) | Đổi class hộp modal thành `modal-box w-11/12 max-w-sm p-4 sm:p-6 mx-auto`; chuyển cụm nút hành động thành `flex flex-col-reverse sm:flex-row gap-2` với nút full-width trên mobile. | `js/views/deleteConfirmView.js` |
| **09** | **Thấp** | [ ] Chưa sửa | **Nhóm chọn "Loại giao dịch" trong Form dùng `<div>` thay vì cấu trúc ngữ nghĩa `<fieldset>` và `<legend>`**, hạn chế khả năng đọc của Screen Reader. | **Mọi kích thước** | Đổi thẻ bao ngoài thành `<fieldset class="form-control w-full">` và đổi nhãn thành `<legend class="label-text font-semibold pb-1.5">`. | `js/views/transactionFormView.js` |
| **10** | **Thấp** | [ ] Chưa sửa | **Nút "✕" đóng Modal có kích thước vùng bấm nhỏ (30px × 30px)**, khó thao tác chính xác bằng ngón tay cái trên thiết bị di động. | **375px**, **768px**, **1440px** | Tăng kích thước nút đóng lên `btn-md` (tối thiểu 40px–44px) hoặc mở rộng padding xung quanh để đạt chuẩn touch target tối thiểu 44px. | `js/views/transactionFormView.js`, `js/views/deleteConfirmView.js`, `js/views/importConfirmView.js` |
| **11** | **Thấp** | [ ] Chưa sửa | **Nút hành động chính "Thêm giao dịch" trên Navbar thiếu icon nhận diện trực quan**, trọng lượng thị giác chưa vượt trội so với 2 nút phụ. | **768px**, **1440px** (Desktop & Tablet) | Thêm icon dấu cộng `+` (SVG) phía trước chữ "Thêm giao dịch", tăng padding hoặc bóng đổ nhẹ `shadow-sm` để tạo điểm nhấn Call-To-Action (CTA) số 1. | `index.html` |
| **12** | **Thấp** | [ ] Chưa sửa | **Trạng thái rỗng khi lọc (Empty State) chỉ là một dòng chữ đơn điệu**, thiếu icon minh họa và nút bấm nhanh "Bỏ lọc". | **Mọi kích thước** | Render khối empty-state thân thiện với icon tìm kiếm mờ, tiêu đề "Không tìm thấy giao dịch nào" và nút bấm nhanh "Xóa bộ lọc" ngay bên dưới. | `js/views/transactionListView.js` |

---

## 2. Chi Tiết Đánh Giá Theo Từng Kích Thước Màn Hình

### 2.1. Màn hình Di động — Mobile (375px × 667px)

#### A. Điều hướng (Navigation) & Bố cục (Layout)
- **Hiện tượng tràn ngang nghiêm trọng**:
  - Đo đạc qua CDP: `document.documentElement.scrollWidth = 441px` trong khi `clientWidth = 375px`. Trang web bị tràn ngang **66px**.
  - Nguyên nhân: Navbar ở thẻ `<header>` chứa tiêu đề và cụm 3 nút ở `.navbar-end`:
    * `#btn-add-transaction`: rộng 110px.
    * `#btn-import-data`: rộng 117px.
    * `#btn-export-data`: rộng 112px, tọa độ `left: 329px, right: 441px`.
  - Hậu quả: Nút "Xuất dữ liệu" bị cắt mất quá nửa ngoài mép phải màn hình; tiêu đề "Quản lý thu chi" bị ép sát vào nút thêm. Người dùng vô tình vuốt ngang sẽ thấy toàn bộ trang bị lắc lư sang phải, để lộ khoảng trắng nền.

#### B. Thẻ Tổng quan (Summary Cards)
- 3 thẻ hiển thị dạng cột xếp dọc (`grid-cols-1`).
- Số tiền lớn (ví dụ: `31.200.000 ₫`, `21.680.000 ₫`) hiển thị với font `text-2xl` vừa vặn, không bị rớt dòng.
- Khoảng cách giữa các thẻ (`gap-4`) cân đối, dễ nhìn.

#### C. Thanh Lọc (Filter Section)
- Trên 375px, 5 trường lọc xếp dọc thành 1 cột (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-12`).
- Thứ tự: Tháng → Loại → Danh mục → Tìm trong ghi chú → Nút Xóa lọc.
- Khoảng cách và độ cao input (`input-sm`, cao 32px) gọn gàng, tuy nhiên chiều cao 32px hơi nhỏ so với tiêu chuẩn chạm cảm ứng tối thiểu 44px.

#### D. Danh sách Thẻ Giao dịch (Transaction Cards)
- Giao diện chuyển đổi chuẩn xác sang dạng thẻ xếp dọc (`createMobileCards`).
- **Lỗi vùng chạm (Touch Target)**:
  * Hai nút "Sửa" và "Xóa" nằm ở góc trên bên phải mỗi thẻ có kích thước thực tế chỉ **37px rộng × 24px cao** (`btn-ghost btn-xs`).
  * Khoảng cách giữa 2 nút chỉ là 6px (`gap-1.5`). Người dùng ngón tay cái rất dễ bấm trượt hoặc bấm nhầm vào nút "Xóa" nguy hiểm.
- **Hiển thị nội dung**:
  * Badge loại giao dịch ("Thu nhập" màu xanh lá, "Chi phí" màu đỏ hồng) hiển thị rõ ràng.
  * Số tiền hiển thị to, in đậm, căn phải (`text-right text-base font-bold`).
  * Ghi chú hiển thị đầy đủ, ngắt dòng tự nhiên, không làm vỡ khung thẻ.

#### E. Hộp thoại (Modals) trên Mobile
- **Modal Thêm/Sửa giao dịch**:
  * `modal-box max-w-md w-full p-6` kết hợp cùng lỗi tràn trang 441px khiến hộp modal bị đẩy lệch sang mép trái màn hình.
  * Toàn bộ chữ ở lề trái bị cắt cụt ký tự đầu ("hêm giao dịch", "oại giao dịch", "ố tiền", "anh mục", "gày giao dịch", "hi chú").
  * Nút "✕" góc trên bên phải bị đẩy sát mép phải.
- **Modal Xác nhận xóa**:
  * Hộp thoại bị dồn sang mép phải, nút "Xác nhận xóa" ở chân modal bị chạm viền ngoài màn hình.

---

### 2.2. Màn hình Máy tính bảng — Tablet (768px × 1024px)

#### A. Điều hướng & Tổng quan
- Navbar ở 768px hiển thị thoải mái trên 1 hàng, không bị tràn ngang (`hasHorizontalScroll: false`). Tiêu đề và 3 nút hành động có khoảng thở tốt.
- 3 thẻ tổng quan (Tổng thu, Tổng chi, Số dư) dàn thành 3 cột đều nhau (`md:grid-cols-3`), trực quan và cân đối.

#### B. Bố cục Bộ lọc (Filter Grid)
- Ở kích thước 768px (`sm:grid-cols-2`), lưới lọc chia làm 2 cột:
  * Hàng 1: Tháng (cột 1) — Loại (cột 2).
  * Hàng 2: Danh mục (cột 1) — Tìm trong ghi chú (cột 2).
  * Hàng 3: Nút "Xóa lọc" được cấu hình `sm:col-span-2` nên chiếm trọn 100% chiều ngang hàng 3 (~ 700px).
- Nút "Xóa lọc" dạng viền đen mỏng bị kéo dài bất thường trông như một dải phân cách thay vì một nút bấm, làm giảm tính thẩm mỹ của form lọc.

#### C. Bảng Dữ liệu Giao dịch (Transaction Table)
- Breakpoint `md:` kích hoạt hiển thị thẻ `<table>`.
- 6 cột gồm: Ngày (120px) | Loại (100px) | Danh mục (120px) | Ghi chú (~180px) | Số tiền (120px) | Thao tác (80px).
- **Vấn đề ngắt dòng Ghi chú**:
  * Do tổng chiều rộng bảng bị giới hạn trong container (~ 720px), cột Ghi chú chỉ được phân bổ khoảng 180px.
  * Với các ghi chú thực tế dài 15–20 từ (ví dụ: "Ăn tối buffet cuối tuần cùng gia đình tại BBQ & Hotpot"), nội dung bị ép ngắt thành 4 đến 5 dòng.
  * Chiều cao hàng bị phình to bất thường, làm cho bảng bị lộn xộn, mất đi tính đồng nhất khi cuộn xem danh sách.

---

### 2.3. Màn hình Máy tính để bàn — Desktop (1440px × 900px)

#### A. Bố cục Tổng thể & Khung nhìn
- Ứng dụng được bao bọc trong container `max-w-5xl` (~ 1024px) căn giữa màn hình với `mx-auto`. Khoảng trống hai bên biên tạo cảm giác thoáng đãng, sang trọng và tập trung thị giác tốt.
- Các khoảng cách padding (`p-4 sm:p-6`) và margin (`space-y-6`) tuân thủ nhịp điệu 8pt chuẩn mực.

#### B. Phân cấp Thị giác (Visual Hierarchy)
- Cấp độ tiêu đề rõ ràng:
  * Tiêu đề ứng dụng `h1`: 20px, font-bold (700).
  * Tiêu đề vùng `h2` ("Danh sách giao dịch"): 18px, font-bold (700).
  * Tiêu đề thẻ stat `.stat-title`: 12px, font-normal (400), màu xám trung tính.
  * Con số thống kê `#summary-income`, `#summary-expense`, `#summary-balance`: 30px, font-extrabold (800).
- Điểm mắt người dùng lập tức hướng vào 3 con số thống kê và bảng dữ liệu chính.

#### C. Khả năng Tiếp cận (Accessibility & WCAG)
1. **Độ tương phản màu sắc (Contrast Ratio)**:
   - Màu `text-success` của DaisyUI v5 (`oklch(0.76 0.177 163.223)`) trên nền thẻ trắng: Tỷ lệ tương phản chỉ đạt **1.88 : 1**, **thất bại hoàn toàn chuẩn WCAG AA** (yêu cầu tối thiểu 4.5:1 với văn bản thường, 3.0:1 với văn bản lớn). Màu xanh này rất nhạt, gây chói mắt và cực kỳ khó đọc với người dùng có mắt yếu.
   - Màu `text-error` (`oklch(0.71 0.194 13.428)`) trên nền trắng: Tỷ lệ tương phản chỉ đạt **2.4 : 1**, cũng **thất bại chuẩn WCAG AA**.
   - Chữ tiêu đề phụ `text-base-content/70` (~ độ mờ 70%) trên nền thẻ trắng xám có độ tương phản mấp mé ngưỡng tối thiểu.
2. **Focus bàn phím (Keyboard Focus Navigation)**:
   - Khi điều hướng bằng phím Tab, các phần tử input và select có focus ring mặc định của DaisyUI.
   - Tuy nhiên, các nút bấm dạng ghost (`.btn-ghost.btn-xs`) ở cột Thao tác (Sửa, Xóa) có chỉ báo focus mờ nhạt, khó nhận diện khi duyệt danh sách dài bằng bàn phím.
3. **Liên kết nhãn (Form Labels & Semantics)**:
   - Các trường trong bộ lọc và form thêm giao dịch đều có thuộc tính `for` / `htmlFor` khớp chuẩn với `id` của input tương ứng.
   - Riêng nhóm radio "Loại giao dịch" trong `transactionFormView.js` sử dụng thẻ `<div>` thay vì `<fieldset>` và `<legend>`, làm giảm khả năng thông báo ngữ cảnh của trình đọc màn hình.

---

## 3. Ảnh Chụp Minh Họa Thực Tế Từng Kích Thước

Các ảnh chụp màn hình thực tế được ghi nhận trực tiếp từ trình duyệt trong phiên kiểm thử:

1. **Mobile 375px — Toàn cảnh và lỗi tràn ngang Navbar**:
   - Vị trí tệp lưu trữ: `scratch/viewport_375px_main.png`
   - Mô tả: Nút "Xuất dữ liệu" bị đẩy ra ngoài mép phải (x = 329px đến 441px). Thanh cuộn ngang xuất hiện làm rung lắc trang.

2. **Mobile 375px — Modal Thêm giao dịch bị cắt cụt ký tự đầu**:
   - Vị trí tệp lưu trữ: `scratch/viewport_375px_form_modal.png`
   - Mô tả: Hộp thoại modal bị lệch sang trái, mất toàn bộ chữ cái đầu mép trái ("hêm giao dịch", "oại", "ố tiền", "anh mục", "gày", "hi chú").

3. **Mobile 375px — Modal Xác nhận xóa**:
   - Vị trí tệp lưu trữ: `scratch/viewport_375px_delete_modal.png`
   - Mô tả: Nút "Xác nhận xóa" bị dồn sát mép phải màn hình, các nút thao tác thiếu khoảng đệm an toàn.

4. **Tablet 768px — Bảng giao dịch và Lưới lọc**:
   - Vị trí tệp lưu trữ: `scratch/viewport_768px_main.png`
   - Mô tả: Cột "Ghi chú" bị ép hẹp khiến chữ ngắt 4–5 dòng làm hàng cao bất thường; nút "Xóa lọc" bị kéo giãn full-width bất hợp lý ở hàng 3.

5. **Desktop 1440px — Giao diện chính và Độ tương phản**:
   - Vị trí tệp lưu trữ: `scratch/viewport_1440px_main.png`
   - Mô tả: Bố cục cân đối, thoáng đãng; tuy nhiên màu xanh của Tổng thu quá sáng, thiếu độ tương phản sắc nét trên nền trắng.

6. **Desktop 1440px — Modal Form Thêm/Sửa**:
   - Vị trí tệp lưu trữ: `scratch/viewport_1440px_form_modal.png`
   - Mô tả: Hộp thoại hiển thị chuẩn mực ở trung tâm màn hình, các trường nhập liệu phân bổ hài hòa.

---

## 4. Kế Hoạch Sửa Chữa Đề Xuất Cho Phiên 12 ("Sửa theo UX")

Để chuẩn bị cho phiên 12 thực hiện sửa mã một cách nhanh chóng, chuẩn xác và không phá vỡ logic nghiệp vụ hiện có:

1. **Ưu tiên 1 (Xử lý vấn đề Cao) — [x] ĐÃ HOÀN THÀNH Ở PHIÊN 12**:
   - [x] Đã sửa `index.html`: Cấu hình responsive cho `navbar-end` (`px-2 sm:px-4`, ẩn nhãn chữ trên mobile, chỉ hiện icon) -> triệt tiêu hoàn toàn lỗi tràn ngang tại 375px (scrollWidth = 375px, maxRight = 367px).
   - [x] Đã sửa `js/views/transactionFormView.js`: Áp dụng `w-11/12 max-w-md p-4 sm:p-6 mx-auto` và `modal-bottom sm:modal-middle` -> modal hiển thị trọn vẹn, không bị cắt lề trái, cân đối ở 375px.
   - [x] Đã sửa `js/views/transactionListView.js`: Tăng kích thước nút Sửa/Xóa lên `btn-md` (40px cao × 58px rộng) trên mobile và `btn-sm` (32px cao × 46px rộng) trên tablet/desktop, giãn cách `gap-2 sm:gap-3` -> đạt chuẩn vùng chạm ≥ 40px và ngăn bấm nhầm.
   - [x] Đã sửa màu sắc (`index.html`, `js/views/summaryView.js`, `js/views/transactionListView.js`): Thay `text-success`/`text-error` bằng `text-emerald-700`/`text-rose-700` -> độ tương phản vượt chuẩn WCAG AA (> 4.5:1).
2. **Ưu tiên 2 (Xử lý vấn đề Trung bình — Chưa thực hiện theo yêu cầu phiên)**:
   - Sửa `js/controllers/backupController.js`: Đưa toast xuống góc dưới giữa màn hình trên mobile.
   - Sửa `js/views/transactionListView.js`: Cắt gọn ghi chú dài trên bảng kèm tooltip.
   - Sửa `index.html`: Căn phải nút "Xóa lọc" thay vì kéo giãn full-width trên tablet.
   - Sửa `js/views/deleteConfirmView.js`: Tối ưu bố cục nút xóa trên màn hình nhỏ.
3. **Ưu tiên 3 (Xử lý vấn đề Thấp)**:
   - Nâng cấp ngữ nghĩa `<fieldset>` cho nhóm radio.
   - Tăng kích thước nút đóng "✕" trên modal.
   - Bổ sung icon `+` cho nút Thêm giao dịch và cải thiện giao diện Empty State khi lọc.
