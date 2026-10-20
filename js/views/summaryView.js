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

  /**
   * Hiệu ứng đếm số mượt mà và nảy vui tươi (cute number counter)
   * Tuân thủ: Dùng textContent an toàn tuyệt đối, tôn trọng prefers-reduced-motion
   * @param {HTMLElement} element
   * @param {number} targetValue
   */
  function animateNumber(element, targetValue) {
    if (!element) return;
    const previous = typeof element._prevVal === 'number' ? element._prevVal : 0;
    element._prevVal = targetValue;

    // Tôn trọng prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = formatCurrency(targetValue);
      return;
    }

    if (previous === targetValue) {
      element.textContent = formatCurrency(targetValue);
      return;
    }

    // Kích hoạt class animation nảy vui tươi
    element.classList.remove('number-pop');
    void element.offsetWidth; // Buộc reflow để kích hoạt lại animation
    element.classList.add('number-pop');

    const duration = 350; // ms
    const startTime = performance.now();
    const diff = targetValue - previous;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(previous + diff * ease);
      element.textContent = formatCurrency(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = formatCurrency(targetValue);
      }
    }
    requestAnimationFrame(step);
  }

  /**
   * Tạo SVG sao 4 cánh an toàn cho nhãn nhỏ kiểu bookmark
   * @returns {SVGElement}
   */
  function createSparkleSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pointer-events-none');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z');
    svg.appendChild(path);
    return svg;
  }

  /**
   * Tạo một thẻ Polaroid theo phong cách Scrapbook (DESIGN_SPEC.md) bằng DOM API an toàn
   * @param {Object} options
   * @param {string} options.title - Tiêu đề thẻ (Tổng thu / Tổng chi / Số dư)
   * @param {string} options.valueId - ID gán cho phần tử hiển thị giá trị (#summary-income / #summary-expense / #summary-balance)
   * @param {string} options.valueText - Giá trị ban đầu
   * @param {string} options.colorClass - Class màu giá trị đạt chuẩn tương phản WCAG AA
   * @param {string} options.tiltClass - Class nghiêng (polaroid-tilt-left, polaroid-tilt-center, polaroid-tilt-right)
   * @param {string} options.tapeClass - Class căn vị trí băng keo (tape-tilt-left, tape-tilt-center, tape-tilt-right)
   * @param {string} options.dotColor - Màu chấm tròn chỉ báo
   * @param {string} options.captionText - Chữ chú thích viết tay ở đáy thẻ
   * @returns {HTMLElement}
   */
  function createPolaroidCard(options) {
    const card = document.createElement('div');
    card.className = 'polaroid-card ' + (options.tiltClass || '') + ' p-3.5 sm:p-4 pb-6 sm:pb-7 transition-all duration-200';

    // 1. Băng keo dán mép trên
    const tape = document.createElement('div');
    tape.className = 'tape pointer-events-none ' + (options.tapeClass || '');
    tape.setAttribute('aria-hidden', 'true');
    card.appendChild(tape);

    // 2. Nhãn nhỏ kiểu bookmark có sao ở góc thẻ
    const bookmark = document.createElement('div');
    bookmark.className = 'bookmark-tag pointer-events-none';
    bookmark.setAttribute('aria-hidden', 'true');
    bookmark.appendChild(createSparkleSvg());
    card.appendChild(bookmark);

    // 3. Khung ảnh Polaroid bên trong chứa thông tin
    const inner = document.createElement('div');
    inner.className = 'polaroid-inner p-3.5 sm:p-4';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center justify-between';

    const titleEl = document.createElement('span');
    titleEl.className = 'text-xs font-semibold uppercase tracking-wider text-[#24406F]';
    titleEl.textContent = options.title;

    const dotEl = document.createElement('span');
    dotEl.className = 'w-2 h-2 rounded-full pointer-events-none ' + (options.dotColor || 'bg-[#2F5DA8]/70');
    dotEl.setAttribute('aria-hidden', 'true');

    headerRow.appendChild(titleEl);
    headerRow.appendChild(dotEl);

    const valueEl = document.createElement('div');
    valueEl.id = options.valueId;
    valueEl.className = 'text-2xl lg:text-3xl font-bold tracking-tight font-body mt-2.5 ' + options.colorClass;
    valueEl.textContent = options.valueText;

    inner.appendChild(headerRow);
    inner.appendChild(valueEl);
    card.appendChild(inner);

    // 4. Đáy Polaroid dày hơn có chữ viết tay trang trí
    if (options.captionText) {
      const captionEl = document.createElement('div');
      captionEl.className = 'font-script text-sm sm:text-base text-[#2F5DA8] opacity-80 mt-2 text-right pr-1 pointer-events-none select-none';
      captionEl.setAttribute('aria-hidden', 'true');
      captionEl.textContent = options.captionText;
      card.appendChild(captionEl);
    }

    return card;
  }

  /**
   * Vẽ phần tổng quan (3 thẻ thống kê Polaroid)
   * Chỉ thao tác DOM, không gọi service hay storage
   * @param {Object} summary - { totalIncome, totalExpense, balance }
   * @param {HTMLElement} [targetContainer]
   */
  function render(summary, targetContainer) {
    const data = summary || {};
    const totalIncome = Number(data.totalIncome) || 0;
    const totalExpense = Number(data.totalExpense) || 0;
    const balance = data.balance !== undefined ? Number(data.balance) : (totalIncome - totalExpense);

    let incomeEl = document.getElementById('summary-income');
    let expenseEl = document.getElementById('summary-expense');
    let balanceEl = document.getElementById('summary-balance');

    // Nếu các phần tử chưa có trong DOM và có container chỉ định, dựng các thẻ Polaroid
    if ((!incomeEl || !expenseEl || !balanceEl) && targetContainer) {
      targetContainer.textContent = '';
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 lg:gap-6 items-stretch';
      grid.id = 'summary-cards';

      const incomeCard = createPolaroidCard({
        title: 'Tổng thu',
        valueId: 'summary-income',
        valueText: formatCurrency(totalIncome),
        colorClass: 'text-income',
        tiltClass: 'polaroid-tilt-left',
        tapeClass: 'tape-tilt-left',
        dotColor: 'bg-[#0F766E]/70',
        captionText: 'tiền vào ~'
      });
      const expenseCard = createPolaroidCard({
        title: 'Tổng chi',
        valueId: 'summary-expense',
        valueText: formatCurrency(totalExpense),
        colorClass: 'text-expense',
        tiltClass: 'polaroid-tilt-center',
        tapeClass: 'tape-tilt-center',
        dotColor: 'bg-[#BE123C]/70',
        captionText: 'tiền ra ~'
      });
      const balanceCard = createPolaroidCard({
        title: 'Số dư',
        valueId: 'summary-balance',
        valueText: formatCurrency(balance),
        colorClass: balance < 0 ? 'text-balance-negative' : 'text-balance-positive',
        tiltClass: 'polaroid-tilt-right',
        tapeClass: 'tape-tilt-right',
        dotColor: 'bg-[#2F5DA8]/70',
        captionText: 'tích lũy ~'
      });

      grid.appendChild(incomeCard);
      grid.appendChild(expenseCard);
      grid.appendChild(balanceCard);
      targetContainer.appendChild(grid);

      // Lưu mốc giá trị ban đầu
      const incEl = document.getElementById('summary-income');
      const expEl = document.getElementById('summary-expense');
      const balEl = document.getElementById('summary-balance');
      if (incEl) incEl._prevVal = totalIncome;
      if (expEl) expEl._prevVal = totalExpense;
      if (balEl) balEl._prevVal = balance;
      return;
    }

    // Cập nhật giá trị an toàn qua animateNumber
    if (incomeEl) {
      animateNumber(incomeEl, totalIncome);
    }
    if (expenseEl) {
      animateNumber(expenseEl, totalExpense);
    }
    if (balanceEl) {
      animateNumber(balanceEl, balance);
      if (balance < 0) {
        balanceEl.classList.remove('text-balance-positive', 'text-primary');
        balanceEl.classList.add('text-balance-negative');
      } else {
        balanceEl.classList.remove('text-balance-negative', 'text-rose-700', 'text-error');
        balanceEl.classList.add('text-balance-positive');
      }
    }
  }

  const SummaryView = {
    render: render,
    formatCurrency: formatCurrency,
    createPolaroidCard: createPolaroidCard,
    createStatCard: createPolaroidCard // Tương thích ngược
  };

  window.App.SummaryView = SummaryView;
  window.App.summaryView = SummaryView;
})();
