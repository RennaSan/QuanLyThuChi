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
    modalDialog.className = 'modal';
    modalDialog.setAttribute('aria-labelledby', 'delete-modal-title');
    modalDialog.setAttribute('role', 'dialog');

    // 2. Hộp modal
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box max-w-sm sm:max-w-md w-full p-6 relative';

    // Nút đóng "✕" góc trên
    btnCloseX = document.createElement('button');
    btnCloseX.type = 'button';
    btnCloseX.id = 'delete-modal-btn-close-x';
    btnCloseX.className = 'btn btn-sm btn-circle btn-ghost absolute right-3 top-3';
    btnCloseX.textContent = '✕';
    btnCloseX.setAttribute('aria-label', 'Đóng hộp thoại');
    btnCloseX.addEventListener('click', close);
    modalBox.appendChild(btnCloseX);

    // Tiêu đề modal
    const titleEl = document.createElement('h3');
    titleEl.id = 'delete-modal-title';
    titleEl.className = 'font-bold text-lg text-error mb-2';
    titleEl.textContent = 'Xác nhận xóa giao dịch';
    modalBox.appendChild(titleEl);

    // Lời nhắn xác nhận
    const descEl = document.createElement('p');
    descEl.className = 'text-sm text-base-content/80 mb-4';
    descEl.textContent = 'Bạn có chắc chắn muốn xóa giao dịch này không? Thao tác này không thể hoàn tác.';
    modalBox.appendChild(descEl);

    // Khung chi tiết giao dịch sắp xóa (Ngày, Số tiền, Danh mục)
    const detailsBox = document.createElement('div');
    detailsBox.className = 'bg-base-200 rounded-box p-4 space-y-2 mb-6 border border-base-300 text-sm';

    // Dòng 1: Ngày
    const rowDate = document.createElement('div');
    rowDate.className = 'flex justify-between items-center';
    const lblDate = document.createElement('span');
    lblDate.className = 'text-base-content/70';
    lblDate.textContent = 'Ngày:';
    dateEl = document.createElement('span');
    dateEl.id = 'delete-confirm-date';
    dateEl.className = 'font-medium text-base-content';
    rowDate.appendChild(lblDate);
    rowDate.appendChild(dateEl);
    detailsBox.appendChild(rowDate);

    // Dòng 2: Danh mục
    const rowCategory = document.createElement('div');
    rowCategory.className = 'flex justify-between items-center';
    const lblCategory = document.createElement('span');
    lblCategory.className = 'text-base-content/70';
    lblCategory.textContent = 'Danh mục:';
    categoryEl = document.createElement('span');
    categoryEl.id = 'delete-confirm-category';
    categoryEl.className = 'font-medium text-base-content';
    rowCategory.appendChild(lblCategory);
    rowCategory.appendChild(categoryEl);
    detailsBox.appendChild(rowCategory);

    // Dòng 3: Loại giao dịch
    const rowType = document.createElement('div');
    rowType.className = 'flex justify-between items-center';
    const lblType = document.createElement('span');
    lblType.className = 'text-base-content/70';
    lblType.textContent = 'Loại:';
    typeEl = document.createElement('span');
    typeEl.id = 'delete-confirm-type';
    typeEl.className = 'badge badge-sm font-medium';
    rowType.appendChild(lblType);
    rowType.appendChild(typeEl);
    detailsBox.appendChild(rowType);

    // Dòng 4: Số tiền
    const rowAmount = document.createElement('div');
    rowAmount.className = 'flex justify-between items-center pt-2 border-t border-base-300';
    const lblAmount = document.createElement('span');
    lblAmount.className = 'text-base-content/70 font-medium';
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
    noteRowEl.className = 'pt-2 border-t border-base-300 flex flex-col gap-0.5 hidden';
    const lblNote = document.createElement('span');
    lblNote.className = 'text-xs text-base-content/70';
    lblNote.textContent = 'Ghi chú:';
    noteEl = document.createElement('span');
    noteEl.id = 'delete-confirm-note';
    noteEl.className = 'text-sm text-base-content break-words';
    noteRowEl.appendChild(lblNote);
    noteRowEl.appendChild(noteEl);
    detailsBox.appendChild(noteRowEl);

    modalBox.appendChild(detailsBox);

    // Nút hành động
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'modal-action mt-4 flex items-center justify-end gap-2';

    btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.id = 'delete-modal-btn-cancel';
    btnCancel.className = 'btn btn-ghost';
    btnCancel.textContent = 'Hủy';
    btnCancel.addEventListener('click', close);

    btnConfirm = document.createElement('button');
    btnConfirm.type = 'button';
    btnConfirm.id = 'delete-modal-btn-confirm';
    btnConfirm.className = 'btn btn-error text-white';
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
      typeEl.className = 'badge badge-sm font-medium ' + (isIncome ? 'badge-success' : 'badge-error');
    }
    if (amountEl) {
      amountEl.textContent = formatCurrency(transaction.amount);
      amountEl.className = 'font-bold text-base ' + (isIncome ? 'text-success' : 'text-error');
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
