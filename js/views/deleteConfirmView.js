window.App = window.App || {};

(function () {
  let modalDialog = null;
  let dateEl = null;
  let categoryEl = null;
  let amountEl = null;
  let typeEl = null;
  let noteRowEl = null;
  let noteEl = null;
  let btnCancel = null;
  let btnConfirm = null;
  let btnCloseX = null;

  let currentTransactionId = null;
  let onConfirmCallback = null;

  /**
   * Định dạng số tiền theo chuẩn vi-VN (VND, số nguyên)
   * @param {number|string} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    if (typeof window.App.formatCurrency === 'function') {
      return window.App.formatCurrency(amount);
    }
    if (window.App.TransactionListView && typeof window.App.TransactionListView.formatCurrency === 'function') {
      return window.App.TransactionListView.formatCurrency(amount);
    }
    const num = Math.round(Number(amount)) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  }

  /**
   * Tạo phần tử kẹp giấy SVG đơn giản ở góc modal theo DESIGN_SPEC.md
   * @returns {SVGElement}
   */
  function createPaperclipSVG() {
    const clipSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    clipSvg.setAttribute('class', 'modal-clip clip pointer-events-none');
    clipSvg.setAttribute('viewBox', '0 0 24 40');
    clipSvg.setAttribute('fill', 'none');
    clipSvg.setAttribute('stroke', 'currentColor');
    clipSvg.setAttribute('stroke-width', '2.2');
    clipSvg.setAttribute('stroke-linecap', 'round');
    clipSvg.setAttribute('stroke-linejoin', 'round');
    clipSvg.setAttribute('aria-hidden', 'true');

    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clipPath.setAttribute('d', 'M7 13v15a5 5 0 0010 0V8a7 7 0 00-14 0v20a9 9 0 0018 0V13');
    clipSvg.appendChild(clipPath);

    return clipSvg;
  }

  /**
   * Tạo phần tử băng keo dải xanh kẻ ca-rô nghiêng ở mép trên theo DESIGN_SPEC.md
   * @returns {HTMLElement}
   */
  function createTapeElement() {
    const tapeEl = document.createElement('div');
    tapeEl.className = 'tape modal-tape pointer-events-none';
    tapeEl.setAttribute('aria-hidden', 'true');
    return tapeEl;
  }

  /**
   * Xây dựng cấu trúc DOM cho Modal xác nhận xóa bằng DaisyUI
   * Tuân thủ quy tắc: DOM thuần, textContent an toàn tuyệt đối, không innerHTML
   */
  function buildModalDOM() {
    if (modalDialog && document.getElementById('delete-confirm-modal')) {
      return;
    }

    const existing = document.getElementById('delete-confirm-modal');
    if (existing) {
      modalDialog = existing;
      return;
    }

    // 1. Thẻ dialog DaisyUI
    modalDialog = document.createElement('dialog');
    modalDialog.id = 'delete-confirm-modal';
    modalDialog.className = 'modal modal-bottom sm:modal-middle';
    modalDialog.setAttribute('aria-labelledby', 'delete-modal-title');
    modalDialog.setAttribute('aria-describedby', 'delete-modal-desc');
    modalDialog.setAttribute('role', 'dialog');

    // 2. Hộp modal (Giấy trắng, bo góc theo DESIGN_SPEC.md)
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box w-11/12 max-w-sm sm:max-w-md p-4 sm:p-6 mx-auto relative modal-paper';

    // Kẹp giấy SVG đơn giản ở góc trên bên trái modal
    modalBox.appendChild(createPaperclipSVG());

    // Băng keo dải xanh kẻ ca-rô dán nghiêng ở mép trên modal
    modalBox.appendChild(createTapeElement());

    // Nút đóng "✕" góc trên (Vùng chạm >= 40px theo UX_REVIEW.md mục 10)
    btnCloseX = document.createElement('button');
    btnCloseX.type = 'button';
    btnCloseX.id = 'delete-modal-btn-close-x';
    btnCloseX.className = 'btn btn-ghost btn-circle modal-btn-close absolute right-3 top-3 text-[#24406F]/70 hover:text-[#24406F] hover:bg-[#F4F8FE]';
    btnCloseX.textContent = '✕';
    btnCloseX.setAttribute('aria-label', 'Đóng hộp thoại');
    btnCloseX.addEventListener('click', close);
    modalBox.appendChild(btnCloseX);

    // Tiêu đề modal (Playfair Display hoa, giãn chữ nhẹ theo DESIGN_SPEC.md)
    const titleEl = document.createElement('h3');
    titleEl.id = 'delete-modal-title';
    titleEl.className = 'font-title font-bold text-lg text-expense mb-2 uppercase tracking-wider flex items-center gap-2';
    titleEl.textContent = 'Xác nhận xóa giao dịch';
    modalBox.appendChild(titleEl);

    // Lời nhắn xác nhận
    const descEl = document.createElement('p');
    descEl.id = 'delete-modal-desc';
    descEl.className = 'text-sm text-[#24406F]/80 mb-4';
    descEl.textContent = 'Bạn có chắc chắn muốn xóa giao dịch này không? Thao tác này không thể hoàn tác.';
    modalBox.appendChild(descEl);

    // Khung chi tiết giao dịch sắp xóa (Ngày, Số tiền, Danh mục)
    const detailsBox = document.createElement('div');
    detailsBox.className = 'bg-[#F8FAFD] rounded-lg p-3.5 sm:p-4 space-y-2.5 mb-5 border border-[#BFD3EE] text-sm';

    // Dòng 1: Ngày
    const rowDate = document.createElement('div');
    rowDate.className = 'flex justify-between items-center';
    const lblDate = document.createElement('span');
    lblDate.className = 'text-[#24406F]/70';
    lblDate.textContent = 'Ngày:';
    dateEl = document.createElement('span');
    dateEl.id = 'delete-confirm-date';
    dateEl.className = 'font-medium text-[#24406F]';
    rowDate.appendChild(lblDate);
    rowDate.appendChild(dateEl);
    detailsBox.appendChild(rowDate);

    // Dòng 2: Danh mục
    const rowCategory = document.createElement('div');
    rowCategory.className = 'flex justify-between items-center';
    const lblCategory = document.createElement('span');
    lblCategory.className = 'text-[#24406F]/70';
    lblCategory.textContent = 'Danh mục:';
    categoryEl = document.createElement('span');
    categoryEl.id = 'delete-confirm-category';
    categoryEl.className = 'font-medium text-[#24406F]';
    rowCategory.appendChild(lblCategory);
    rowCategory.appendChild(categoryEl);
    detailsBox.appendChild(rowCategory);

    // Dòng 3: Loại giao dịch
    const rowType = document.createElement('div');
    rowType.className = 'flex justify-between items-center';
    const lblType = document.createElement('span');
    lblType.className = 'text-[#24406F]/70';
    lblType.textContent = 'Loại:';
    typeEl = document.createElement('span');
    typeEl.id = 'delete-confirm-type';
    typeEl.className = 'badge badge-sm font-medium';
    rowType.appendChild(lblType);
    rowType.appendChild(typeEl);
    detailsBox.appendChild(rowType);

    // Dòng 4: Số tiền
    const rowAmount = document.createElement('div');
    rowAmount.className = 'flex justify-between items-center pt-2.5 border-t border-[#BFD3EE]';
    const lblAmount = document.createElement('span');
    lblAmount.className = 'text-[#24406F]/70 font-medium';
    lblAmount.textContent = 'Số tiền:';
    amountEl = document.createElement('span');
    amountEl.id = 'delete-confirm-amount';
    amountEl.className = 'font-bold text-base';
    rowAmount.appendChild(lblAmount);
    rowAmount.appendChild(amountEl);
    detailsBox.appendChild(rowAmount);

    // Dòng 5: Ghi chú (nếu có)
    noteRowEl = document.createElement('div');
    noteRowEl.id = 'delete-confirm-note-row';
    noteRowEl.className = 'pt-2.5 border-t border-[#BFD3EE] flex flex-col gap-0.5 hidden';
    const lblNote = document.createElement('span');
    lblNote.className = 'text-xs text-[#24406F]/70';
    lblNote.textContent = 'Ghi chú:';
    noteEl = document.createElement('span');
    noteEl.id = 'delete-confirm-note';
    noteEl.className = 'text-sm text-[#24406F] break-words';
    noteRowEl.appendChild(lblNote);
    noteRowEl.appendChild(noteEl);
    detailsBox.appendChild(noteRowEl);

    modalBox.appendChild(detailsBox);

    // Nút hành động (Mobile: xếp cột đảo thứ tự, full-width theo UX_REVIEW.md mục 08)
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'modal-action mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-2';

    btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.id = 'delete-modal-btn-cancel';
    btnCancel.className = 'btn btn-ghost w-full sm:w-auto min-h-[40px] border border-[#BFD3EE] hover:bg-[#F4F8FE] text-[#24406F]';
    btnCancel.textContent = 'Hủy';
    btnCancel.addEventListener('click', close);

    btnConfirm = document.createElement('button');
    btnConfirm.type = 'button';
    btnConfirm.id = 'delete-modal-btn-confirm';
    btnConfirm.className = 'btn btn-error text-white w-full sm:w-auto min-h-[40px] shadow-xs';
    btnConfirm.textContent = 'Xác nhận xóa';
    btnConfirm.addEventListener('click', handleConfirm);

    actionWrapper.appendChild(btnCancel);
    actionWrapper.appendChild(btnConfirm);
    modalBox.appendChild(actionWrapper);

    modalDialog.appendChild(modalBox);

    // 3. Backdrop DaisyUI
    const backdropForm = document.createElement('form');
    backdropForm.method = 'dialog';
    backdropForm.className = 'modal-backdrop';
    const backdropBtn = document.createElement('button');
    backdropBtn.type = 'button';
    backdropBtn.textContent = 'close';
    backdropBtn.addEventListener('click', close);
    backdropForm.appendChild(backdropBtn);
    modalDialog.appendChild(backdropForm);

    modalDialog.addEventListener('cancel', function () {
      currentTransactionId = null;
    });

    document.body.appendChild(modalDialog);
  }

  /**
   * Xử lý khi nhấn nút Xác nhận xóa
   */
  function handleConfirm() {
    const id = currentTransactionId;
    if (!id) {
      close();
      return;
    }

    if (typeof onConfirmCallback === 'function') {
      onConfirmCallback(id);
    }
  }

  /**
   * Mở modal xác nhận xóa và hiển thị thông tin giao dịch
   * @param {Object} transaction - Giao dịch cần xóa { id, date, amount, category, type, note }
   * @param {Function} [onConfirm] - Callback khi xác nhận xóa
   */
  function open(transaction, onConfirm) {
    if (!transaction) return;
    buildModalDOM();

    currentTransactionId = transaction.id || null;
    if (typeof onConfirm === 'function') {
      onConfirmCallback = onConfirm;
    }

    const isIncome = transaction.type === 'income';

    if (dateEl) {
      dateEl.textContent = transaction.date || '';
    }
    if (categoryEl) {
      categoryEl.textContent = transaction.category || '';
    }
    if (typeEl) {
      typeEl.textContent = isIncome ? 'Thu nhập' : 'Chi phí';
      typeEl.className = 'badge badge-sm font-medium ' + (isIncome ? 'badge-success text-white' : 'badge-error text-white');
    }
    if (amountEl) {
      amountEl.textContent = formatCurrency(transaction.amount);
      amountEl.className = 'font-bold text-base ' + (isIncome ? 'text-income' : 'text-expense');
    }

    if (noteRowEl && noteEl) {
      if (transaction.note && String(transaction.note).trim() !== '') {
        noteEl.textContent = transaction.note;
        noteRowEl.classList.remove('hidden');
      } else {
        noteEl.textContent = '';
        noteRowEl.classList.add('hidden');
      }
    }

    if (modalDialog && typeof modalDialog.showModal === 'function') {
      modalDialog.showModal();
    }

    // Đặt tiêu điểm vào nút Hủy để tránh bấm nhầm phím Enter xóa ngay
    setTimeout(function () {
      if (btnCancel) {
        btnCancel.focus();
      }
    }, 50);
  }

  /**
   * Đóng modal xác nhận
   */
  function close() {
    currentTransactionId = null;
    if (modalDialog && typeof modalDialog.close === 'function') {
      modalDialog.close();
    }
  }

  /**
   * Đăng ký callback khi xác nhận xóa
   * @param {Function} callback
   */
  function setOnConfirm(callback) {
    onConfirmCallback = callback;
  }

  /**
   * Khởi tạo view
   */
  function init() {
    buildModalDOM();
  }

  const DeleteConfirmView = {
    init: init,
    open: open,
    close: close,
    setOnConfirm: setOnConfirm
  };

  window.App.DeleteConfirmView = DeleteConfirmView;
  window.App.deleteConfirmView = DeleteConfirmView;
})();
