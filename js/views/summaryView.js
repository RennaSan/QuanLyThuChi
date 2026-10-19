window.App = window.App || {};

(function () {
  /**
   * Định dạng số tiền theo chuẩn vi-VN (VND, số nguyên)
   * @param {number|string} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    const num = Math.round(Number(amount)) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  }

  /**
   * Tạo một thẻ stat DaisyUI bằng DOM API an toàn
   * @param {string} title - Tiêu đề thẻ (Tổng thu / Tổng chi / Số dư)
   * @param {string} valueId - ID gán cho phần tử hiển thị giá trị
   * @param {string} valueText - Giá trị ban đầu
   * @param {string} valueColorClass - Class màu DaisyUI (text-success, text-error, text-primary)
   * @returns {HTMLElement}
   */
  function createStatCard(title, valueId, valueText, valueColorClass) {
    const statsWrapper = document.createElement('div');
    statsWrapper.className = 'stats shadow-sm bg-base-100 border border-base-300 w-full';

    const stat = document.createElement('div');
    stat.className = 'stat';

    const statTitle = document.createElement('div');
    statTitle.className = 'stat-title text-base-content/70';
    statTitle.textContent = title;

    const statValue = document.createElement('div');
    statValue.id = valueId;
    statValue.className = 'stat-value text-2xl lg:text-3xl ' + valueColorClass;
    statValue.textContent = valueText;

    stat.appendChild(statTitle);
    stat.appendChild(statValue);
    statsWrapper.appendChild(stat);

    return statsWrapper;
  }

  /**
   * Vẽ phần tổng quan (3 thẻ thống kê DaisyUI)
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

    // Nếu các phần tử chưa có trong DOM và có container chỉ định, dựng các thẻ stat
    if ((!incomeEl || !expenseEl || !balanceEl) && targetContainer) {
      targetContainer.textContent = '';
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
      grid.id = 'summary-cards';

      const incomeCard = createStatCard('Tổng thu', 'summary-income', formatCurrency(totalIncome), 'text-emerald-700');
      const expenseCard = createStatCard('Tổng chi', 'summary-expense', formatCurrency(totalExpense), 'text-rose-700');
      const balanceCard = createStatCard('Số dư', 'summary-balance', formatCurrency(balance), balance < 0 ? 'text-rose-700' : 'text-primary');

      grid.appendChild(incomeCard);
      grid.appendChild(expenseCard);
      grid.appendChild(balanceCard);
      targetContainer.appendChild(grid);
      return;
    }

    // Cập nhật giá trị an toàn qua textContent
    if (incomeEl) {
      incomeEl.textContent = formatCurrency(totalIncome);
    }
    if (expenseEl) {
      expenseEl.textContent = formatCurrency(totalExpense);
    }
    if (balanceEl) {
      balanceEl.textContent = formatCurrency(balance);
      if (balance < 0) {
        balanceEl.classList.remove('text-primary');
        balanceEl.classList.add('text-rose-700');
      } else {
        balanceEl.classList.remove('text-rose-700');
        balanceEl.classList.add('text-primary');
      }
    }
  }

  const SummaryView = {
    render: render,
    formatCurrency: formatCurrency
  };

  window.App.SummaryView = SummaryView;
  window.App.summaryView = SummaryView;
})();
