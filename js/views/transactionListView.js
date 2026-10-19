window.App = window.App || {};

(function () {
  /**
   * Định dạng số tiền theo chuẩn vi-VN (VND, số nguyên)
   * @param {number|string} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    if (typeof window.App.formatCurrency === 'function') {
      return window.App.formatCurrency(amount);
    }
    const num = Math.round(Number(amount)) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  }

  let onEditCallback = null;
  let onDeleteCallback = null;

  /**
   * Đăng ký hàm xử lý khi người dùng nhấn nút Sửa
   * @param {Function} callback
   */
  function setOnEdit(callback) {
    onEditCallback = callback;
  }

  /**
   * Đăng ký hàm xử lý khi người dùng nhấn nút Xóa
   * @param {Function} callback
   */
  function setOnDelete(callback) {
    onDeleteCallback = callback;
  }

  /**
   * Vẽ trạng thái rỗng khi chưa có dữ liệu giao dịch
   * @param {HTMLElement} container
   */
  function renderEmptyState(container, message) {
    const emptyWrapper = document.createElement('div');
    emptyWrapper.id = 'empty-state';
    emptyWrapper.className = 'text-center py-12 text-base-content/60';

    const emptyText = document.createElement('p');
    emptyText.className = 'text-base font-medium';
    emptyText.textContent = message || 'Chưa có giao dịch';

    emptyWrapper.appendChild(emptyText);
    container.appendChild(emptyWrapper);
  }

  /**
   * Tạo bảng danh sách cho màn hình lớn (desktop)
   * Cột: Ngày, Loại, Danh mục, Ghi chú, Số tiền
   * @param {Array} transactions
   * @returns {HTMLElement}
   */
  function createDesktopTable(transactions) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'hidden md:block overflow-x-auto w-full';

    const table = document.createElement('table');
    table.className = 'table w-full';
    table.setAttribute('aria-label', 'Bảng danh sách giao dịch');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = [
      { text: 'Ngày', className: 'whitespace-nowrap' },
      { text: 'Loại', className: 'whitespace-nowrap' },
      { text: 'Danh mục', className: 'whitespace-nowrap' },
      { text: 'Ghi chú', className: 'w-2/5' },
      { text: 'Số tiền', className: 'text-right whitespace-nowrap' },
      { text: 'Thao tác', className: 'text-right whitespace-nowrap' }
    ];

    columns.forEach(function (col) {
      const th = document.createElement('th');
      th.textContent = col.text;
      if (col.className) {
        th.className = col.className;
      }
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    transactions.forEach(function (item) {
      if (!item) return;

      const isIncome = item.type === 'income';
      const tr = document.createElement('tr');
      tr.className = 'hover';

      // 1. Cột Ngày
      const tdDate = document.createElement('td');
      tdDate.className = 'whitespace-nowrap font-medium';
      tdDate.textContent = item.date || '';

      // 2. Cột Loại
      const tdType = document.createElement('td');
      tdType.className = 'whitespace-nowrap';
      const badge = document.createElement('span');
      badge.className = 'badge badge-sm font-medium ' + (isIncome ? 'badge-success' : 'badge-error');
      badge.textContent = isIncome ? 'Thu nhập' : 'Chi phí';
      tdType.appendChild(badge);

      // 3. Cột Danh mục
      const tdCategory = document.createElement('td');
      tdCategory.className = 'whitespace-nowrap';
      tdCategory.textContent = item.category || '';

      // 4. Cột Ghi chú: Dùng textContent an toàn tuyệt đối, tránh XSS và không parse mã HTML
      const tdNote = document.createElement('td');
      tdNote.className = 'max-w-xs break-words';
      tdNote.textContent = item.note || '';

      // 5. Cột Số tiền: Định dạng vi-VN với màu tương phản chuẩn WCAG AA
      const tdAmount = document.createElement('td');
      tdAmount.className = 'text-right whitespace-nowrap font-semibold ' + (isIncome ? 'text-emerald-700' : 'text-rose-700');
      tdAmount.textContent = formatCurrency(item.amount);

      // 6. Cột Thao tác: Nút Sửa và Nút Xóa với kích thước btn-sm
      const tdAction = document.createElement('td');
      tdAction.className = 'text-right whitespace-nowrap space-x-2';
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn btn-ghost btn-sm px-3 text-primary font-medium btn-edit';
      btnEdit.textContent = 'Sửa';
      btnEdit.setAttribute('aria-label', 'Sửa giao dịch ' + (item.category || ''));
      btnEdit.dataset.id = item.id;
      btnEdit.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof onEditCallback === 'function') {
          onEditCallback(item.id);
        }
      });

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn btn-ghost btn-sm px-3 text-rose-700 font-medium btn-delete';
      btnDelete.textContent = 'Xóa';
      btnDelete.setAttribute('aria-label', 'Xóa giao dịch ' + (item.category || ''));
      btnDelete.dataset.id = item.id;
      btnDelete.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof onDeleteCallback === 'function') {
          onDeleteCallback(item.id);
        }
      });

      tdAction.appendChild(btnEdit);
      tdAction.appendChild(btnDelete);

      tr.appendChild(tdDate);
      tr.appendChild(tdType);
      tr.appendChild(tdCategory);
      tr.appendChild(tdNote);
      tr.appendChild(tdAmount);
      tr.appendChild(tdAction);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    return tableWrapper;
  }

  /**
   * Tạo danh sách thẻ xếp dọc cho màn hình di động (mobile)
   * Không cuộn ngang tại 375px
   * @param {Array} transactions
   * @returns {HTMLElement}
   */
  function createMobileCards(transactions) {
    const mobileWrapper = document.createElement('div');
    mobileWrapper.className = 'block md:hidden flex flex-col gap-3 w-full';

    transactions.forEach(function (item) {
      if (!item) return;

      const isIncome = item.type === 'income';

      const card = document.createElement('div');
      card.className = 'p-3.5 rounded-box bg-base-100 border border-base-300 shadow-xs flex flex-col gap-2 max-w-full';

      // Dòng 1: Ngày, Badge Loại và Nút Sửa
      const headerRow = document.createElement('div');
      headerRow.className = 'flex items-center justify-between text-xs text-base-content/70';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'font-medium';
      dateSpan.textContent = item.date || '';

      const headerRight = document.createElement('div');
      headerRight.className = 'flex items-center gap-2 sm:gap-3';

      const badge = document.createElement('span');
      badge.className = 'badge badge-sm font-medium ' + (isIncome ? 'badge-success' : 'badge-error');
      badge.textContent = isIncome ? 'Thu nhập' : 'Chi phí';

      const btnEditMobile = document.createElement('button');
      btnEditMobile.type = 'button';
      btnEditMobile.className = 'btn btn-ghost btn-md px-3 text-primary font-medium btn-edit';
      btnEditMobile.textContent = 'Sửa';
      btnEditMobile.setAttribute('aria-label', 'Sửa giao dịch ' + (item.category || ''));
      btnEditMobile.dataset.id = item.id;
      btnEditMobile.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof onEditCallback === 'function') {
          onEditCallback(item.id);
        }
      });

      const btnDeleteMobile = document.createElement('button');
      btnDeleteMobile.type = 'button';
      btnDeleteMobile.className = 'btn btn-ghost btn-md px-3 text-rose-700 font-medium btn-delete';
      btnDeleteMobile.textContent = 'Xóa';
      btnDeleteMobile.setAttribute('aria-label', 'Xóa giao dịch ' + (item.category || ''));
      btnDeleteMobile.dataset.id = item.id;
      btnDeleteMobile.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof onDeleteCallback === 'function') {
          onDeleteCallback(item.id);
        }
      });

      headerRight.appendChild(badge);
      headerRight.appendChild(btnEditMobile);
      headerRight.appendChild(btnDeleteMobile);

      headerRow.appendChild(dateSpan);
      headerRow.appendChild(headerRight);

      // Dòng 2: Danh mục và Số tiền
      const mainRow = document.createElement('div');
      mainRow.className = 'flex items-baseline justify-between gap-2';

      const categorySpan = document.createElement('span');
      categorySpan.className = 'font-semibold text-base text-base-content break-words';
      categorySpan.textContent = item.category || '';

      const amountSpan = document.createElement('span');
      amountSpan.className = 'font-bold text-base whitespace-nowrap ' + (isIncome ? 'text-emerald-700' : 'text-rose-700');
      amountSpan.textContent = formatCurrency(item.amount);

      mainRow.appendChild(categorySpan);
      mainRow.appendChild(amountSpan);

      card.appendChild(headerRow);
      card.appendChild(mainRow);

      // Dòng 3: Ghi chú (nếu có) dùng textContent
      if (item.note && String(item.note).trim() !== '') {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'text-sm text-base-content/80 break-words pt-1 border-t border-base-200';
        noteDiv.textContent = item.note;
        card.appendChild(noteDiv);
      }

      mobileWrapper.appendChild(card);
    });

    return mobileWrapper;
  }

  /**
   * Vẽ danh sách giao dịch:
   * - Bảng ở màn lớn (md trở lên)
   * - Thẻ xếp dọc ở di động (dưới md)
   * - "Chưa có giao dịch" khi chưa có dữ liệu
   * @param {Array} transactions
   * @param {HTMLElement} [targetContainer]
   */
  function render(transactions, targetContainer, options) {
    let container;
    let opts = {};

    if (targetContainer && targetContainer.nodeType === Node.ELEMENT_NODE) {
      container = targetContainer;
      opts = options || {};
    } else if (targetContainer && typeof targetContainer === 'object' && !targetContainer.nodeType) {
      container = document.getElementById('transaction-list-container');
      opts = targetContainer;
    } else {
      container = targetContainer || document.getElementById('transaction-list-container');
      opts = options || {};
    }

    if (!container) return;

    // Xóa nội dung cũ bằng textContent
    container.textContent = '';

    const items = Array.isArray(transactions) ? transactions : [];

    if (items.length === 0) {
      renderEmptyState(container, opts.emptyMessage);
      return;
    }

    // 1. Dựng bảng cho màn hình lớn
    const desktopTable = createDesktopTable(items);
    container.appendChild(desktopTable);

    // 2. Dựng danh sách thẻ cho màn hình di động
    const mobileCards = createMobileCards(items);
    container.appendChild(mobileCards);
  }

  const TransactionListView = {
    render: render,
    formatCurrency: formatCurrency,
    setOnEdit: setOnEdit,
    setOnDelete: setOnDelete
  };

  window.App.TransactionListView = TransactionListView;
  window.App.transactionListView = TransactionListView;
})();
