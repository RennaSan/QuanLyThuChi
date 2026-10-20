window.App = window.App || {};

(function () {
  let modalDialog = null;
  let formElement = null;
  let modalTitleEl = null;
  let inputId = null;
  let radioExpense = null;
  let radioIncome = null;
  let inputAmount = null;
  let selectCategory = null;
  let inputDate = null;
  let textareaNote = null;
  let btnCancel = null;
  let btnSubmit = null;
  let btnCloseX = null;

  // Đối tượng lưu các thẻ hiển thị lỗi dưới từng trường
  let errorElements = {};

  let onSubmitCallback = null;

  /**
   * Lấy ngày hiện tại dạng YYYY-MM-DD
   * @returns {string}
   */
  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  /**
   * Lấy danh sách danh mục theo loại từ Config
   * @param {string} type - 'income' hoặc 'expense'
   * @returns {string[]}
   */
  function getCategories(type) {
    if (typeof window.App.getCategories === 'function') {
      return window.App.getCategories(type);
    }
    const config = window.App.Config || {};
    if (type === 'income') {
      return (config.CATEGORIES && config.CATEGORIES.income) || config.INCOME_CATEGORIES || [];
    }
    return (config.CATEGORIES && config.CATEGORIES.expense) || config.EXPENSE_CATEGORIES || [];
  }

  /**
   * Cập nhật danh sách option trong thẻ select danh mục theo loại
   * Tuân thủ quy tắc: Không dùng innerHTML, chỉ dùng textContent và DOM API an toàn
   * @param {string} type
   * @param {string} [selectedCategory]
   */
  function updateCategoryOptions(type, selectedCategory) {
    if (!selectCategory) return;

    // Xóa toàn bộ option cũ
    while (selectCategory.firstChild) {
      selectCategory.removeChild(selectCategory.firstChild);
    }

    const categories = getCategories(type);
    let matched = false;

    categories.forEach(function (cat) {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      if (selectedCategory && cat === selectedCategory) {
        option.selected = true;
        matched = true;
      }
      selectCategory.appendChild(option);
    });

    if (!matched && categories.length > 0) {
      selectCategory.value = categories[0];
    }
  }

  /**
   * Tạo phần tử hiển thị lỗi bên dưới một trường nhập liệu
   * @param {string} fieldName
   * @returns {HTMLElement}
   */
  function createErrorElement(fieldName) {
    const err = document.createElement('p');
    err.id = 'form-error-' + fieldName;
    err.className = 'text-error text-xs font-medium mt-1 min-h-[1.25rem] hidden';
    err.setAttribute('role', 'alert');
    errorElements[fieldName] = err;
    return err;
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
   * Dựng toàn bộ DOM cho Modal Form DaisyUI
   * Tuân thủ: Dùng DOM thuần, textContent an toàn, đầy đủ nhãn và bàn phím
   */
  function buildModalDOM() {
    if (document.getElementById('transaction-modal')) {
      modalDialog = document.getElementById('transaction-modal');
      return;
    }

    // 1. Thẻ dialog chính của DaisyUI
    modalDialog = document.createElement('dialog');
    modalDialog.id = 'transaction-modal';
    modalDialog.className = 'modal modal-bottom sm:modal-middle';
    modalDialog.setAttribute('aria-labelledby', 'form-modal-title');
    modalDialog.setAttribute('role', 'dialog');

    // 2. Hộp modal (Giấy trắng, bo góc theo DESIGN_SPEC.md)
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box w-11/12 max-w-md p-4 sm:p-6 mx-auto relative modal-paper';

    // Kẹp giấy SVG đơn giản ở góc trên bên trái modal
    modalBox.appendChild(createPaperclipSVG());

    // Băng keo dải xanh kẻ ca-rô dán nghiêng ở mép trên modal
    modalBox.appendChild(createTapeElement());

    // Nút đóng "✕" góc trên (Vùng chạm >= 40px theo UX_REVIEW.md mục 10)
    btnCloseX = document.createElement('button');
    btnCloseX.type = 'button';
    btnCloseX.id = 'form-btn-close-x';
    btnCloseX.className = 'btn btn-ghost btn-circle modal-btn-close absolute right-3 top-3 text-[#24406F]/70 hover:text-[#24406F] hover:bg-[#F4F8FE]';
    btnCloseX.textContent = '✕';
    btnCloseX.setAttribute('aria-label', 'Đóng hộp thoại');
    btnCloseX.addEventListener('click', close);
    modalBox.appendChild(btnCloseX);

    // Tiêu đề modal (Playfair Display hoa, giãn chữ nhẹ theo DESIGN_SPEC.md)
    modalTitleEl = document.createElement('h3');
    modalTitleEl.id = 'form-modal-title';
    modalTitleEl.className = 'font-title font-bold text-lg mb-4 text-[#2F5DA8] uppercase tracking-wider';
    modalTitleEl.textContent = 'Thêm giao dịch';
    modalBox.appendChild(modalTitleEl);

    // Form chính
    formElement = document.createElement('form');
    formElement.id = 'transaction-form';
    formElement.noValidate = true;
    formElement.className = 'flex flex-col gap-3';

    // Trường ẩn: ID (khi sửa)
    inputId = document.createElement('input');
    inputId.type = 'hidden';
    inputId.id = 'form-transaction-id';
    inputId.name = 'id';
    inputId.value = '';
    formElement.appendChild(inputId);

    // --- Trường 1: Loại giao dịch (Dùng fieldset và legend theo UX_REVIEW.md mục 09) ---
    const fieldTypeGroup = document.createElement('fieldset');
    fieldTypeGroup.className = 'form-control w-full border-0 p-0 m-0';

    const legendType = document.createElement('legend');
    legendType.className = 'label-text font-semibold text-[#24406F] pb-1.5 block w-full';
    legendType.textContent = 'Loại giao dịch';
    fieldTypeGroup.appendChild(legendType);

    const radioGroupWrapper = document.createElement('div');
    radioGroupWrapper.className = 'grid grid-cols-2 gap-2.5';
    radioGroupWrapper.setAttribute('role', 'radiogroup');
    radioGroupWrapper.setAttribute('aria-label', 'Loại giao dịch');

    // Radio: Chi phí
    const labelExpense = document.createElement('label');
    labelExpense.className = 'label cursor-pointer justify-start gap-2.5 border border-[#BFD3EE] rounded-lg p-2.5 min-h-[44px] hover:bg-[#F4F8FE] transition-colors';

    radioExpense = document.createElement('input');
    radioExpense.type = 'radio';
    radioExpense.name = 'type';
    radioExpense.value = 'expense';
    radioExpense.id = 'form-type-expense';
    radioExpense.className = 'radio radio-error radio-sm';
    radioExpense.checked = true;

    const spanExpense = document.createElement('span');
    spanExpense.className = 'label-text font-medium text-expense';
    spanExpense.textContent = 'Chi phí';

    labelExpense.appendChild(radioExpense);
    labelExpense.appendChild(spanExpense);

    // Radio: Thu nhập
    const labelIncome = document.createElement('label');
    labelIncome.className = 'label cursor-pointer justify-start gap-2.5 border border-[#BFD3EE] rounded-lg p-2.5 min-h-[44px] hover:bg-[#F4F8FE] transition-colors';

    radioIncome = document.createElement('input');
    radioIncome.type = 'radio';
    radioIncome.name = 'type';
    radioIncome.value = 'income';
    radioIncome.id = 'form-type-income';
    radioIncome.className = 'radio radio-success radio-sm';

    const spanIncome = document.createElement('span');
    spanIncome.className = 'label-text font-medium text-income';
    spanIncome.textContent = 'Thu nhập';

    labelIncome.appendChild(radioIncome);
    labelIncome.appendChild(spanIncome);

    radioGroupWrapper.appendChild(labelExpense);
    radioGroupWrapper.appendChild(labelIncome);
    fieldTypeGroup.appendChild(radioGroupWrapper);
    fieldTypeGroup.appendChild(createErrorElement('type'));
    formElement.appendChild(fieldTypeGroup);

    // Lắng nghe đổi loại để cập nhật danh sách danh mục tức thì
    radioExpense.addEventListener('change', function () {
      if (radioExpense.checked) {
        updateCategoryOptions('expense');
      }
    });
    radioIncome.addEventListener('change', function () {
      if (radioIncome.checked) {
        updateCategoryOptions('income');
      }
    });

    // --- Trường 2: Số tiền ---
    const fieldAmountGroup = document.createElement('div');
    fieldAmountGroup.className = 'form-control w-full';

    const labelAmount = document.createElement('label');
    labelAmount.htmlFor = 'form-amount';
    labelAmount.className = 'label pb-1.5';
    const labelAmountText = document.createElement('span');
    labelAmountText.className = 'label-text font-semibold text-[#24406F]';
    labelAmountText.textContent = 'Số tiền (VND)';
    labelAmount.appendChild(labelAmountText);

    inputAmount = document.createElement('input');
    inputAmount.type = 'number';
    inputAmount.id = 'form-amount';
    inputAmount.name = 'amount';
    inputAmount.className = 'input input-bordered w-full min-h-[40px] text-[#24406F] bg-[#F8FAFD] border-[#BFD3EE] focus:bg-white focus:border-[#4F86D9]';
    inputAmount.placeholder = 'Ví dụ: 50000';
    inputAmount.min = '1';
    inputAmount.step = '1';
    inputAmount.setAttribute('aria-required', 'true');
    inputAmount.setAttribute('aria-describedby', 'form-error-amount');

    fieldAmountGroup.appendChild(labelAmount);
    fieldAmountGroup.appendChild(inputAmount);
    fieldAmountGroup.appendChild(createErrorElement('amount'));
    formElement.appendChild(fieldAmountGroup);

    // --- Trường 3: Danh mục ---
    const fieldCategoryGroup = document.createElement('div');
    fieldCategoryGroup.className = 'form-control w-full';

    const labelCategory = document.createElement('label');
    labelCategory.htmlFor = 'form-category';
    labelCategory.className = 'label pb-1.5';
    const labelCategoryText = document.createElement('span');
    labelCategoryText.className = 'label-text font-semibold text-[#24406F]';
    labelCategoryText.textContent = 'Danh mục';
    labelCategory.appendChild(labelCategoryText);

    selectCategory = document.createElement('select');
    selectCategory.id = 'form-category';
    selectCategory.name = 'category';
    selectCategory.className = 'select select-bordered w-full min-h-[40px] text-[#24406F] bg-[#F8FAFD] border-[#BFD3EE] focus:bg-white focus:border-[#4F86D9]';
    selectCategory.setAttribute('aria-required', 'true');
    selectCategory.setAttribute('aria-describedby', 'form-error-category');

    fieldCategoryGroup.appendChild(labelCategory);
    fieldCategoryGroup.appendChild(selectCategory);
    fieldCategoryGroup.appendChild(createErrorElement('category'));
    formElement.appendChild(fieldCategoryGroup);

    // --- Trường 4: Ngày giao dịch ---
    const fieldDateGroup = document.createElement('div');
    fieldDateGroup.className = 'form-control w-full';

    const labelDate = document.createElement('label');
    labelDate.htmlFor = 'form-date';
    labelDate.className = 'label pb-1.5';
    const labelDateText = document.createElement('span');
    labelDateText.className = 'label-text font-semibold text-[#24406F]';
    labelDateText.textContent = 'Ngày giao dịch';
    labelDate.appendChild(labelDateText);

    inputDate = document.createElement('input');
    inputDate.type = 'date';
    inputDate.id = 'form-date';
    inputDate.name = 'date';
    inputDate.className = 'input input-bordered w-full min-h-[40px] text-[#24406F] bg-[#F8FAFD] border-[#BFD3EE] focus:bg-white focus:border-[#4F86D9]';
    inputDate.setAttribute('aria-required', 'true');
    inputDate.setAttribute('aria-describedby', 'form-error-date');

    fieldDateGroup.appendChild(labelDate);
    fieldDateGroup.appendChild(inputDate);
    fieldDateGroup.appendChild(createErrorElement('date'));
    formElement.appendChild(fieldDateGroup);

    // --- Trường 5: Ghi chú ---
    const fieldNoteGroup = document.createElement('div');
    fieldNoteGroup.className = 'form-control w-full';

    const labelNote = document.createElement('label');
    labelNote.htmlFor = 'form-note';
    labelNote.className = 'label pb-1.5';
    const labelNoteText = document.createElement('span');
    labelNoteText.className = 'label-text font-semibold text-[#24406F]';
    labelNoteText.textContent = 'Ghi chú';
    const labelNoteAlt = document.createElement('span');
    labelNoteAlt.className = 'label-text-alt text-[#24406F]/60';
    labelNoteAlt.textContent = '(tối đa 200 ký tự)';
    labelNote.appendChild(labelNoteText);
    labelNote.appendChild(labelNoteAlt);

    textareaNote = document.createElement('textarea');
    textareaNote.id = 'form-note';
    textareaNote.name = 'note';
    textareaNote.rows = 2;
    textareaNote.className = 'textarea textarea-bordered w-full text-[#24406F] bg-[#F8FAFD] border-[#BFD3EE] focus:bg-white focus:border-[#4F86D9]';
    textareaNote.placeholder = 'Ghi chú thêm...';
    textareaNote.setAttribute('aria-describedby', 'form-error-note');

    fieldNoteGroup.appendChild(labelNote);
    fieldNoteGroup.appendChild(textareaNote);
    fieldNoteGroup.appendChild(createErrorElement('note'));
    formElement.appendChild(fieldNoteGroup);

    // --- Nút hành động Form (Mobile: xếp cột đảo thứ tự, full-width theo UX_REVIEW.md mục 08) ---
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'modal-action mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-2';

    btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.id = 'form-btn-cancel';
    btnCancel.className = 'btn btn-ghost w-full sm:w-auto min-h-[40px] border border-[#BFD3EE] hover:bg-[#F4F8FE] text-[#24406F]';
    btnCancel.textContent = 'Hủy';
    btnCancel.addEventListener('click', close);

    btnSubmit = document.createElement('button');
    btnSubmit.type = 'submit';
    btnSubmit.id = 'form-btn-submit';
    btnSubmit.className = 'btn btn-primary w-full sm:w-auto min-h-[40px] shadow-xs';
    btnSubmit.textContent = 'Lưu';

    actionWrapper.appendChild(btnCancel);
    actionWrapper.appendChild(btnSubmit);
    formElement.appendChild(actionWrapper);

    // Sự kiện submit form
    formElement.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit();
    });

    modalBox.appendChild(formElement);
    modalDialog.appendChild(modalBox);

    // 3. Backdrop DaisyUI để bấm ra ngoài hoặc nhấn Esc đóng hộp thoại
    const backdropForm = document.createElement('form');
    backdropForm.method = 'dialog';
    backdropForm.className = 'modal-backdrop';
    const backdropBtn = document.createElement('button');
    backdropBtn.type = 'button';
    backdropBtn.textContent = 'close';
    backdropBtn.addEventListener('click', close);
    backdropForm.appendChild(backdropBtn);
    modalDialog.appendChild(backdropForm);

    // Lắng nghe sự kiện cancel của native dialog (khi bấm ESC)
    modalDialog.addEventListener('cancel', function (e) {
      clearErrors();
    });

    document.body.appendChild(modalDialog);
  }

  /**
   * Thu thập dữ liệu từ các trường và gửi qua callback onSubmit
   */
  function handleSubmit() {
    clearErrors();

    const currentType = radioIncome && radioIncome.checked ? 'income' : 'expense';
    const idVal = inputId ? inputId.value.trim() : '';

    const formData = {
      type: currentType,
      amount: inputAmount ? inputAmount.value : '',
      category: selectCategory ? selectCategory.value : '',
      date: inputDate ? inputDate.value : '',
      note: textareaNote ? textareaNote.value : ''
    };

    if (idVal) {
      formData.id = idVal;
    }

    if (typeof onSubmitCallback === 'function') {
      onSubmitCallback(formData);
    }
  }

  /**
   * Xóa toàn bộ thông báo lỗi và trạng thái cảnh báo trên các trường
   */
  function clearErrors() {
    Object.keys(errorElements).forEach(function (field) {
      const errEl = errorElements[field];
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('hidden');
      }
    });

    if (inputAmount) inputAmount.classList.remove('input-error');
    if (selectCategory) selectCategory.classList.remove('select-error');
    if (inputDate) inputDate.classList.remove('input-error');
    if (textareaNote) textareaNote.classList.remove('textarea-error');
  }

  /**
   * Hiển thị danh sách lỗi trả về từ service.validate ngay dưới từng trường
   * Dùng textContent an toàn tuyệt đối
   * @param {Object} errors - { type?, amount?, category?, date?, note?, id? }
   */
  function showErrors(errors) {
    clearErrors();
    if (!errors || typeof errors !== 'object') return;

    let firstErrorField = null;

    Object.keys(errors).forEach(function (field) {
      const msg = errors[field];
      if (!msg) return;

      const errEl = errorElements[field];
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');

        if (!firstErrorField) {
          firstErrorField = field;
        }
      }

      // Đánh dấu viền đỏ cho trường tương ứng
      if (field === 'amount' && inputAmount) {
        inputAmount.classList.add('input-error');
      } else if (field === 'category' && selectCategory) {
        selectCategory.classList.add('select-error');
      } else if (field === 'date' && inputDate) {
        inputDate.classList.add('input-error');
      } else if (field === 'note' && textareaNote) {
        textareaNote.classList.add('textarea-error');
      }
    });

    // Tự động focus vào trường đầu tiên bị lỗi để tiện điều khiển bàn phím
    if (firstErrorField === 'amount' && inputAmount) {
      inputAmount.focus();
    } else if (firstErrorField === 'category' && selectCategory) {
      selectCategory.focus();
    } else if (firstErrorField === 'date' && inputDate) {
      inputDate.focus();
    } else if (firstErrorField === 'note' && textareaNote) {
      textareaNote.focus();
    } else if (firstErrorField === 'type' && radioExpense) {
      radioExpense.focus();
    }
  }

  /**
   * Mở modal ở chế độ "Thêm giao dịch"
   */
  function openAdd() {
    buildModalDOM();
    clearErrors();

    if (modalTitleEl) modalTitleEl.textContent = 'Thêm giao dịch';
    if (btnSubmit) btnSubmit.textContent = 'Lưu';
    if (inputId) inputId.value = '';

    // Mặc định: loại chi phí, ngày hôm nay, số tiền trống, danh mục đầu tiên
    if (radioExpense) radioExpense.checked = true;
    if (radioIncome) radioIncome.checked = false;

    updateCategoryOptions('expense');

    if (inputAmount) inputAmount.value = '';
    if (inputDate) inputDate.value = getTodayString();
    if (textareaNote) textareaNote.value = '';

    if (modalDialog && typeof modalDialog.showModal === 'function') {
      modalDialog.showModal();
    }

    // Đặt tiêu điểm vào ô nhập số tiền để sẵn sàng gõ phím
    setTimeout(function () {
      if (inputAmount) inputAmount.focus();
    }, 50);
  }

  /**
   * Mở modal ở chế độ "Sửa giao dịch" với dữ liệu cũ
   * @param {Object} transaction - Giao dịch cần sửa
   */
  function openEdit(transaction) {
    if (!transaction) return;
    buildModalDOM();
    clearErrors();

    if (modalTitleEl) modalTitleEl.textContent = 'Sửa giao dịch';
    if (btnSubmit) btnSubmit.textContent = 'Lưu';
    if (inputId) inputId.value = transaction.id || '';

    const isIncome = transaction.type === 'income';
    if (radioIncome) radioIncome.checked = isIncome;
    if (radioExpense) radioExpense.checked = !isIncome;

    updateCategoryOptions(isIncome ? 'income' : 'expense', transaction.category);

    if (inputAmount) inputAmount.value = transaction.amount !== undefined ? transaction.amount : '';
    if (inputDate) inputDate.value = transaction.date || getTodayString();
    if (textareaNote) textareaNote.value = transaction.note || '';

    if (modalDialog && typeof modalDialog.showModal === 'function') {
      modalDialog.showModal();
    }

    // Đặt tiêu điểm vào ô số tiền
    setTimeout(function () {
      if (inputAmount) {
        inputAmount.focus();
        inputAmount.select();
      }
    }, 50);
  }

  /**
   * Đóng modal
   */
  function close() {
    clearErrors();
    if (modalDialog && typeof modalDialog.close === 'function') {
      modalDialog.close();
    }
  }

  /**
   * Đăng ký callback khi form submit
   * @param {Function} callback
   */
  function setOnSubmit(callback) {
    onSubmitCallback = callback;
  }

  /**
   * Khởi tạo Form View
   */
  function init() {
    buildModalDOM();
  }

  const TransactionFormView = {
    init: init,
    openAdd: openAdd,
    openEdit: openEdit,
    close: close,
    showErrors: showErrors,
    clearErrors: clearErrors,
    setOnSubmit: setOnSubmit
  };

  window.App.TransactionFormView = TransactionFormView;
  window.App.transactionFormView = TransactionFormView;
})();
