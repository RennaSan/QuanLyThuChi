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
   * Vẽ trạng thái rỗng: khung tem răng cưa, dòng "Không có giao dịch phù hợp" và nút "Xóa bộ lọc"
   * Tuân thủ quy tắc dữ liệu người dùng dùng textContent, không dùng innerHTML.
   * @param {HTMLElement} container
   * @param {string} [message]
   */
  function renderEmptyState(container, message) {
    const emptyWrapper = document.createElement('div');
    emptyWrapper.id = 'empty-state';
    emptyWrapper.className = 'stamp stamp-empty-box py-10 px-6 sm:px-8 my-4 max-w-md mx-auto text-center flex flex-col items-center justify-center';

    // 1. Icon tem / tìm kiếm mờ phong cách Scrapbook
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'w-12 h-12 rounded-full bg-[#F4F8FE] border border-[#BFD3EE] flex items-center justify-center mb-3 text-[#4F86D9] shadow-xs pointer-events-none';
    iconWrapper.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-6 h-6 pointer-events-none');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z');
    svg.appendChild(path);
    iconWrapper.appendChild(svg);
    emptyWrapper.appendChild(iconWrapper);

    // 2. Dòng thông báo rỗng: dùng textContent an toàn tuyệt đối
    const displayText = message || 'Không có giao dịch phù hợp';
    const emptyText = document.createElement('p');
    emptyText.className = 'font-body font-semibold text-base text-[#24406F] mb-1';
    emptyText.textContent = displayText;
    emptyWrapper.appendChild(emptyText);

    // 3. Chú thích chữ viết tay trang trí
    const hintText = document.createElement('p');
    hintText.className = 'font-script text-sm sm:text-base text-[#2F5DA8] opacity-80 mb-4 pointer-events-none select-none';
    hintText.setAttribute('aria-hidden', 'true');
    hintText.textContent = (displayText === 'Chưa có giao dịch') ? 'hãy thêm giao dịch đầu tiên ~' : 'thử đổi từ khóa hoặc bộ lọc xem sao ~';
    emptyWrapper.appendChild(hintText);

    // 4. Nút "Xóa bộ lọc": hiển thị khi lọc không có kết quả hoặc có filter hoạt động
    const hasActiveFilter = Boolean(window.App.filterView && typeof window.App.filterView.hasActiveFilter === 'function' && window.App.filterView.hasActiveFilter());
    const isFilterEmpty = (displayText === 'Không có giao dịch phù hợp') || hasActiveFilter;

    if (isFilterEmpty) {
      const btnReset = document.createElement('button');
      btnReset.type = 'button';
      btnReset.id = 'btn-empty-reset-filter';
      btnReset.className = 'btn btn-outline rounded-full text-xs font-semibold px-5 border-[#BFD3EE] text-[#2F5DA8] hover:bg-[#4F86D9] hover:border-[#4F86D9] hover:text-white transition-all shadow-xs gap-1.5 min-h-[40px] h-10 w-auto';
      btnReset.setAttribute('aria-label', 'Xóa bộ lọc');

      const resetSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      resetSvg.setAttribute('class', 'h-3.5 w-3.5 shrink-0 pointer-events-none');
      resetSvg.setAttribute('fill', 'none');
      resetSvg.setAttribute('viewBox', '0 0 24 24');
      resetSvg.setAttribute('stroke', 'currentColor');
      resetSvg.setAttribute('stroke-width', '2.2');
      resetSvg.setAttribute('aria-hidden', 'true');
      const resetPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      resetPath.setAttribute('stroke-linecap', 'round');
      resetPath.setAttribute('stroke-linejoin', 'round');
      resetPath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
      resetSvg.appendChild(resetPath);
      btnReset.appendChild(resetSvg);

      const btnText = document.createElement('span');
      btnText.textContent = 'Xóa bộ lọc';
      btnReset.appendChild(btnText);

      btnReset.addEventListener('click', function (e) {
        e.preventDefault();
        const mainResetBtn = document.getElementById('btn-reset-filter');
        if (mainResetBtn) {
          mainResetBtn.click();
        } else if (window.App.filterView && typeof window.App.filterView.resetFilter === 'function') {
          window.App.filterView.resetFilter();
          if (window.App.transactionController && typeof window.App.transactionController.handleResetFilter === 'function') {
            window.App.transactionController.handleResetFilter();
          }
        }
      });

      emptyWrapper.appendChild(btnReset);
    }

    container.appendChild(emptyWrapper);
  }

  /**
   * Tạo bảng danh sách cho màn hình lớn (desktop: breakpoint lg 1024px trở lên)
   * Tờ giấy trắng, dòng cách nhau bằng đường chấm xanh (DESIGN_SPEC.md mục 06)
   * Ghi chú tối đa 2 dòng (line-clamp-2) kèm title đầy đủ
   * Nút Sửa/Xóa >= 40px, màu số tiền đạt chuẩn tương phản WCAG AA
   * @param {Array} transactions
   * @returns {HTMLElement}
   */
  function createDesktopTable(transactions) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'hidden lg:block overflow-x-auto w-full transaction-paper';

    const table = document.createElement('table');
    table.className = 'table transaction-table w-full';
    table.setAttribute('aria-label', 'Bảng danh sách giao dịch');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = [
      { text: 'Ngày', className: 'whitespace-nowrap' },
      { text: 'Loại', className: 'whitespace-nowrap' },
      { text: 'Danh mục', className: 'whitespace-nowrap' },
      { text: 'Ghi chú', className: 'w-2/5 min-w-[200px]' },
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

      // 1. Cột Ngày
      const tdDate = document.createElement('td');
      tdDate.className = 'whitespace-nowrap font-medium text-xs sm:text-sm text-[#24406F]/80';
      tdDate.textContent = item.date || '';

      // 2. Cột Loại
      const tdType = document.createElement('td');
      tdType.className = 'whitespace-nowrap';
      const badge = document.createElement('span');
      badge.className = 'badge badge-sm font-medium text-white border-none ' + (isIncome ? 'bg-[#0F766E]' : 'bg-[#BE123C]');
      badge.textContent = isIncome ? 'Thu nhập' : 'Chi phí';
      tdType.appendChild(badge);

      // 3. Cột Danh mục
      const tdCategory = document.createElement('td');
      tdCategory.className = 'whitespace-nowrap font-medium text-[#24406F]';
      tdCategory.textContent = item.category || '';

      // 4. Cột Ghi chú: Dùng textContent an toàn, tối đa 2 dòng (line-clamp-2) kèm title đầy đủ (mục 06)
      const tdNote = document.createElement('td');
      tdNote.className = 'max-w-xs';
      if (item.note && String(item.note).trim() !== '') {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'line-clamp-2 break-words text-sm text-[#24406F]/85';
        noteDiv.textContent = item.note;
        noteDiv.title = item.note;
        tdNote.appendChild(noteDiv);
        tdNote.title = item.note;
      }

      // 5. Cột Số tiền: Định dạng vi-VN với màu tương phản chuẩn WCAG AA (Thu #0F766E, Chi #BE123C)
      const tdAmount = document.createElement('td');
      tdAmount.className = 'text-right whitespace-nowrap font-bold text-base ' + (isIncome ? 'text-[#0F766E] text-income' : 'text-[#BE123C] text-expense');
      tdAmount.textContent = formatCurrency(item.amount);

      // 6. Cột Thao tác: Nút Sửa và Nút Xóa đảm bảo vùng chạm >= 40px
      const tdAction = document.createElement('td');
      tdAction.className = 'text-right whitespace-nowrap space-x-1.5';

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn btn-ghost btn-sm px-3 text-[#2F5DA8] hover:bg-[#E3EDFA] font-medium btn-edit min-h-[40px] h-10';
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
      btnDelete.className = 'btn btn-ghost btn-sm px-3 text-[#BE123C] hover:bg-[#FEE2E2] font-medium btn-delete min-h-[40px] h-10';
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
   * Tạo danh sách thẻ cho màn hình nhỏ và vừa (mobile & tablet < 1024px)
   * Không cuộn ngang tại 375px và 768px
   * Dạng thẻ giấy trắng, dòng cách nhau bằng đường chấm xanh
   * Ghi chú tối đa 2 dòng (line-clamp-2) kèm title đầy đủ
   * Nút Sửa/Xóa >= 40px và màu số tiền đạt chuẩn tương phản
   * @param {Array} transactions
   * @returns {HTMLElement}
   */
  function createMobileCards(transactions) {
    const mobileWrapper = document.createElement('div');
    mobileWrapper.className = 'block lg:hidden flex flex-col gap-3.5 w-full';

    transactions.forEach(function (item) {
      if (!item) return;

      const isIncome = item.type === 'income';

      const card = document.createElement('div');
      card.className = 'transaction-card flex flex-col gap-2 max-w-full';

      // Dòng 1: Ngày, Badge Loại và Cụm nút Thao tác (Sửa/Xóa >= 40px)
      const headerRow = document.createElement('div');
      headerRow.className = 'flex items-center justify-between text-xs text-[#24406F]/70';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'font-medium';
      dateSpan.textContent = item.date || '';

      const headerRight = document.createElement('div');
      headerRight.className = 'flex items-center gap-1.5 sm:gap-2';

      const badge = document.createElement('span');
      badge.className = 'badge badge-sm font-medium text-white border-none ' + (isIncome ? 'bg-[#0F766E]' : 'bg-[#BE123C]');
      badge.textContent = isIncome ? 'Thu nhập' : 'Chi phí';

      const btnEditMobile = document.createElement('button');
      btnEditMobile.type = 'button';
      btnEditMobile.className = 'btn btn-ghost btn-sm px-3 text-[#2F5DA8] hover:bg-[#E3EDFA] font-medium btn-edit min-h-[40px] h-10';
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
      btnDeleteMobile.className = 'btn btn-ghost btn-sm px-3 text-[#BE123C] hover:bg-[#FEE2E2] font-medium btn-delete min-h-[40px] h-10';
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
      categorySpan.className = 'font-semibold text-base text-[#24406F] break-words';
      categorySpan.textContent = item.category || '';

      const amountSpan = document.createElement('span');
      amountSpan.className = 'font-bold text-base whitespace-nowrap ' + (isIncome ? 'text-[#0F766E] text-income' : 'text-[#BE123C] text-expense');
      amountSpan.textContent = formatCurrency(item.amount);

      mainRow.appendChild(categorySpan);
      mainRow.appendChild(amountSpan);

      card.appendChild(headerRow);
      card.appendChild(mainRow);

      // Dòng 3: Ghi chú (nếu có) dùng textContent, tối đa 2 dòng (line-clamp-2) kèm title đầy đủ
      if (item.note && String(item.note).trim() !== '') {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'text-sm text-[#24406F]/85 line-clamp-2 break-words pt-2 mt-1 transaction-card-divider';
        noteDiv.textContent = item.note;
        noteDiv.title = item.note;
        card.appendChild(noteDiv);
      }

      mobileWrapper.appendChild(card);
    });

    return mobileWrapper;
  }

  /**
   * Vẽ danh sách giao dịch:
   * - Bảng ở màn lớn (lg 1024px trở lên)
   * - Thẻ xếp dọc ở di động & tablet (< 1024px)
   * - Trạng thái rỗng: khung tem răng cưa, dòng "Không có giao dịch phù hợp" và nút "Xóa bộ lọc"
   * @param {Array} transactions
   * @param {HTMLElement} [targetContainer]
   * @param {Object} [options]
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

    // 1. Dựng bảng cho màn hình lớn (breakpoint lg: 1024px)
    const desktopTable = createDesktopTable(items);
    container.appendChild(desktopTable);

    // 2. Dựng danh sách thẻ cho màn hình nhỏ và vừa (< 1024px)
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
