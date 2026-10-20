window.App = window.App || {};

(function () {
  let modalDialog = null;
  let questionEl = null;
  let currentCountEl = null;
  let newCountEl = null;
  let btnCancel = null;
  let btnConfirm = null;
  let btnCloseX = null;

  let onConfirmCallback = null;

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
   * Xây dựng cấu trúc DOM cho Modal xác nhận nhập file bằng DaisyUI
   * Tuân thủ quy tắc: DOM thuần, textContent an toàn tuyệt đối, không innerHTML
   */
  function buildModalDOM() {
    if (modalDialog && document.getElementById('import-confirm-modal')) {
      return;
    }

    const existing = document.getElementById('import-confirm-modal');
    if (existing) {
      modalDialog = existing;
      return;
    }

    // 1. Thẻ dialog DaisyUI
    modalDialog = document.createElement('dialog');
    modalDialog.id = 'import-confirm-modal';
    modalDialog.className = 'modal modal-bottom sm:modal-middle';
    modalDialog.setAttribute('aria-labelledby', 'import-modal-title');
    modalDialog.setAttribute('aria-describedby', 'import-modal-question');
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
    btnCloseX.id = 'import-modal-btn-close-x';
    btnCloseX.className = 'btn btn-ghost btn-circle modal-btn-close absolute right-3 top-3 text-[#24406F]/70 hover:text-[#24406F] hover:bg-[#F4F8FE]';
    btnCloseX.textContent = '✕';
    btnCloseX.setAttribute('aria-label', 'Đóng hộp thoại');
    btnCloseX.addEventListener('click', close);
    modalBox.appendChild(btnCloseX);

    // Tiêu đề modal (Playfair Display hoa, giãn chữ nhẹ theo DESIGN_SPEC.md)
    const titleEl = document.createElement('h3');
    titleEl.id = 'import-modal-title';
    titleEl.className = 'font-title font-bold text-lg text-title-blue mb-2 uppercase tracking-wider flex items-center gap-2';

    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'h-5 w-5 stroke-current pointer-events-none');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('aria-hidden', 'true');
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('stroke-linecap', 'round');
    iconPath.setAttribute('stroke-linejoin', 'round');
    iconPath.setAttribute('stroke-width', '2');
    iconPath.setAttribute('d', 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12');
    iconSvg.appendChild(iconPath);
    titleEl.appendChild(iconSvg);

    const titleText = document.createElement('span');
    titleText.textContent = 'Xác nhận nhập dữ liệu';
    titleEl.appendChild(titleText);
    modalBox.appendChild(titleEl);

    // Câu hỏi xác nhận chính
    questionEl = document.createElement('p');
    questionEl.id = 'import-modal-question';
    questionEl.className = 'text-base font-semibold text-[#24406F] mb-1.5';
    modalBox.appendChild(questionEl);

    // Lời nhắc nhở cảnh báo
    const warningDesc = document.createElement('p');
    warningDesc.className = 'text-xs text-[#24406F]/70 mb-4';
    warningDesc.textContent = 'Lưu ý: Thao tác này sẽ thay thế toàn bộ dữ liệu hiện tại bằng dữ liệu từ file. Dữ liệu cũ sẽ bị ghi đè.';
    modalBox.appendChild(warningDesc);

    // Hộp chi tiết số lượng
    const detailsBox = document.createElement('div');
    detailsBox.className = 'bg-[#F8FAFD] rounded-lg p-3.5 sm:p-4 space-y-2.5 mb-5 border border-[#BFD3EE] text-sm';

    // Dòng 1: Số giao dịch hiện có
    const rowCurrent = document.createElement('div');
    rowCurrent.className = 'flex justify-between items-center';
    const lblCurrent = document.createElement('span');
    lblCurrent.className = 'text-[#24406F]/70';
    lblCurrent.textContent = 'Giao dịch hiện có:';
    currentCountEl = document.createElement('span');
    currentCountEl.id = 'import-confirm-current-count';
    currentCountEl.className = 'badge badge-neutral badge-sm font-semibold text-white';
    rowCurrent.appendChild(lblCurrent);
    rowCurrent.appendChild(currentCountEl);
    detailsBox.appendChild(rowCurrent);

    // Dòng 2: Số giao dịch trong file
    const rowNew = document.createElement('div');
    rowNew.className = 'flex justify-between items-center pt-2.5 border-t border-[#BFD3EE]';
    const lblNew = document.createElement('span');
    lblNew.className = 'text-[#24406F]/70';
    lblNew.textContent = 'Giao dịch trong file:';
    newCountEl = document.createElement('span');
    newCountEl.id = 'import-confirm-new-count';
    newCountEl.className = 'badge badge-primary badge-sm font-semibold text-white';
    rowNew.appendChild(lblNew);
    rowNew.appendChild(newCountEl);
    detailsBox.appendChild(rowNew);

    modalBox.appendChild(detailsBox);

    // Nút hành động (Mobile: xếp cột đảo thứ tự, full-width theo UX_REVIEW.md mục 08)
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'modal-action mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-2';

    btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.id = 'import-modal-btn-cancel';
    btnCancel.className = 'btn btn-ghost w-full sm:w-auto min-h-[40px] border border-[#BFD3EE] hover:bg-[#F4F8FE] text-[#24406F]';
    btnCancel.textContent = 'Hủy';
    btnCancel.addEventListener('click', close);

    btnConfirm = document.createElement('button');
    btnConfirm.type = 'button';
    btnConfirm.id = 'import-modal-btn-confirm';
    btnConfirm.className = 'btn btn-primary w-full sm:w-auto min-h-[40px] shadow-xs';
    btnConfirm.textContent = 'Đồng ý';
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
      onConfirmCallback = null;
    });

    document.body.appendChild(modalDialog);
  }

  /**
   * Xử lý khi nhấn nút Đồng ý
   */
  function handleConfirm() {
    const callback = onConfirmCallback;
    close();
    if (typeof callback === 'function') {
      callback();
    }
  }

  /**
   * Mở modal xác nhận nhập file
   * @param {Object} options { currentCount: number, newCount: number }
   * @param {Function} [onConfirm]
   */
  function open(options, onConfirm) {
    buildModalDOM();

    const opts = options || {};
    const currentCount = typeof opts.currentCount === 'number' ? opts.currentCount : 0;
    const newCount = typeof opts.newCount === 'number' ? opts.newCount : 0;

    if (typeof onConfirm === 'function') {
      onConfirmCallback = onConfirm;
    }

    if (questionEl) {
      questionEl.textContent = 'Thay thế ' + currentCount + ' giao dịch hiện có bằng ' + newCount + ' giao dịch trong file?';
    }

    if (currentCountEl) {
      currentCountEl.textContent = currentCount + ' giao dịch';
    }

    if (newCountEl) {
      newCountEl.textContent = newCount + ' giao dịch';
    }

    if (modalDialog && typeof modalDialog.showModal === 'function') {
      modalDialog.showModal();
    }

    // Đặt tiêu điểm vào nút Hủy để tránh bấm nhầm phím Enter kích hoạt
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
    onConfirmCallback = null;
    if (modalDialog && typeof modalDialog.close === 'function') {
      modalDialog.close();
    }
  }

  /**
   * Đăng ký callback khi xác nhận đồng ý
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

  const ImportConfirmView = {
    init: init,
    open: open,
    close: close,
    setOnConfirm: setOnConfirm
  };

  window.App.ImportConfirmView = ImportConfirmView;
  window.App.importConfirmView = ImportConfirmView;
})();
