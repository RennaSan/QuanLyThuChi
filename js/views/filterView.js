window.App = window.App || {};

(function () {
  let onFilterChangeCallback = null;
  let onResetCallback = null;
  let debounceTimer = null;

  /**
   * Lấy danh sách danh mục theo loại từ Config
   * @param {string} type - 'income' | 'expense' | 'all'
   * @returns {string[]}
   */
  function getCategories(type) {
    const config = window.App.Config || {};
    const defaultExpense = [
      'Ăn uống',
      'Di chuyển',
      'Nhà ở',
      'Học tập',
      'Giải trí',
      'Sức khỏe',
      'Khác'
    ];
    const defaultIncome = [
      'Lương',
      'Thưởng',
      'Khác'
    ];

    const expenseList = (config.CATEGORIES && config.CATEGORIES.expense) ||
                        config.EXPENSE_CATEGORIES ||
                        defaultExpense;

    const incomeList = (config.CATEGORIES && config.CATEGORIES.income) ||
                       config.INCOME_CATEGORIES ||
                       defaultIncome;

    if (type === 'expense') {
      return expenseList;
    }
    if (type === 'income') {
      return incomeList;
    }

    // type === 'all': gom danh sách không trùng lặp
    const combined = [];
    expenseList.forEach(function (cat) {
      if (!combined.includes(cat)) {
        combined.push(cat);
      }
    });
    incomeList.forEach(function (cat) {
      if (!combined.includes(cat)) {
        combined.push(cat);
      }
    });
    return combined;
  }

  /**
   * Cập nhật danh sách tùy chọn của dropdown danh mục dựa trên loại đã chọn
   * Danh mục phụ thuộc loại, đồng thời hỗ trợ lọc khi loại là "all"
   * @param {string} [selectedType]
   */
  function updateCategories(selectedType) {
    const typeSelect = document.getElementById('filter-type');
    const categorySelect = document.getElementById('filter-category');
    if (!categorySelect) return;

    const currentType = selectedType || (typeSelect ? typeSelect.value : 'all');
    const previousCategory = categorySelect.value;

    // Xóa toàn bộ option cũ
    categorySelect.textContent = '';

    // Option mặc định: Tất cả danh mục
    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = 'Tất cả danh mục';
    categorySelect.appendChild(defaultOption);

    const config = window.App.Config || {};
    const defaultExpense = ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Học tập', 'Giải trí', 'Sức khỏe', 'Khác'];
    const defaultIncome = ['Lương', 'Thưởng', 'Khác'];
    const expenseList = (config.CATEGORIES && config.CATEGORIES.expense) || config.EXPENSE_CATEGORIES || defaultExpense;
    const incomeList = (config.CATEGORIES && config.CATEGORIES.income) || config.INCOME_CATEGORIES || defaultIncome;

    if (currentType === 'expense') {
      expenseList.forEach(function (cat) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
      });
      // Nếu danh mục cũ vẫn thuộc danh sách chi phí thì giữ lại
      if (previousCategory && expenseList.includes(previousCategory)) {
        categorySelect.value = previousCategory;
      } else {
        categorySelect.value = 'all';
      }
    } else if (currentType === 'income') {
      incomeList.forEach(function (cat) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
      });
      // Nếu danh mục cũ vẫn thuộc danh sách thu nhập thì giữ lại
      if (previousCategory && incomeList.includes(previousCategory)) {
        categorySelect.value = previousCategory;
      } else {
        categorySelect.value = 'all';
      }
    } else {
      // currentType === 'all': Nhóm bằng optgroup rõ ràng
      const groupExpense = document.createElement('optgroup');
      groupExpense.label = 'Chi phí';
      expenseList.forEach(function (cat) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        groupExpense.appendChild(opt);
      });
      categorySelect.appendChild(groupExpense);

      const groupIncome = document.createElement('optgroup');
      groupIncome.label = 'Thu nhập';
      incomeList.forEach(function (cat) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        groupIncome.appendChild(opt);
      });
      categorySelect.appendChild(groupIncome);

      // Nếu danh mục cũ nằm trong bất kỳ danh mục nào thì giữ lại
      if (previousCategory && (expenseList.includes(previousCategory) || incomeList.includes(previousCategory))) {
        categorySelect.value = previousCategory;
      } else {
        categorySelect.value = 'all';
      }
    }
  }

  /**
   * Lấy giá trị bộ lọc hiện tại từ giao diện
   * @returns {{ month: string, type: string, category: string, keyword: string }}
   */
  function getFilter() {
    const monthEl = document.getElementById('filter-month');
    const typeEl = document.getElementById('filter-type');
    const categoryEl = document.getElementById('filter-category');
    const keywordEl = document.getElementById('filter-keyword');

    const month = monthEl ? monthEl.value.trim() : '';
    const type = typeEl ? typeEl.value.trim() : 'all';
    const category = categoryEl ? categoryEl.value.trim() : 'all';
    const keyword = keywordEl ? keywordEl.value.trim() : '';

    return {
      month: month,
      type: type,
      category: category,
      keyword: keyword
    };
  }

  /**
   * Thiết lập giá trị cho các trường lọc
   * @param {Object} filter
   */
  function setFilter(filter) {
    const f = filter || {};
    const monthEl = document.getElementById('filter-month');
    const typeEl = document.getElementById('filter-type');
    const categoryEl = document.getElementById('filter-category');
    const keywordEl = document.getElementById('filter-keyword');

    if (monthEl && f.month !== undefined) {
      monthEl.value = f.month;
    }

    if (typeEl && f.type !== undefined) {
      typeEl.value = f.type || 'all';
      updateCategories(typeEl.value);
    }

    if (categoryEl && f.category !== undefined) {
      categoryEl.value = f.category || 'all';
    }

    if (keywordEl && f.keyword !== undefined) {
      keywordEl.value = f.keyword;
    }
  }

  /**
   * Xóa toàn bộ bộ lọc và đưa về trạng thái mặc định
   */
  function resetFilter() {
    const monthEl = document.getElementById('filter-month');
    const typeEl = document.getElementById('filter-type');
    const categoryEl = document.getElementById('filter-category');
    const keywordEl = document.getElementById('filter-keyword');

    if (monthEl) monthEl.value = '';
    if (typeEl) typeEl.value = 'all';
    updateCategories('all');
    if (categoryEl) categoryEl.value = 'all';
    if (keywordEl) keywordEl.value = '';
  }

  /**
   * Kiểm tra xem người dùng có đang áp dụng bất kỳ tiêu chí lọc nào không
   * @returns {boolean}
   */
  function hasActiveFilter() {
    const f = getFilter();
    return Boolean(
      (f.month && f.month !== 'all') ||
      (f.type && f.type !== 'all') ||
      (f.category && f.category !== 'all') ||
      (f.keyword && f.keyword !== '')
    );
  }

  /**
   * Đăng ký callback khi bộ lọc thay đổi
   * @param {Function} callback
   */
  function setOnFilterChange(callback) {
    onFilterChangeCallback = callback;
  }

  /**
   * Đăng ký callback khi nhấn nút Xóa lọc
   * @param {Function} callback
   */
  function setOnReset(callback) {
    onResetCallback = callback;
  }

  /**
   * Kích hoạt callback khi bộ lọc thay đổi
   */
  function triggerFilterChange() {
    if (typeof onFilterChangeCallback === 'function') {
      onFilterChangeCallback(getFilter());
    }
  }

  /**
   * Khởi tạo các sự kiện cho thanh lọc
   */
  function init() {
    updateCategories('all');

    const monthEl = document.getElementById('filter-month');
    const typeEl = document.getElementById('filter-type');
    const categoryEl = document.getElementById('filter-category');
    const keywordEl = document.getElementById('filter-keyword');
    const btnReset = document.getElementById('btn-reset-filter');

    if (typeEl) {
      typeEl.addEventListener('change', function () {
        updateCategories(typeEl.value);
        triggerFilterChange();
      });
    }

    if (categoryEl) {
      categoryEl.addEventListener('change', function () {
        triggerFilterChange();
      });
    }

    if (monthEl) {
      monthEl.addEventListener('change', function () {
        triggerFilterChange();
      });
    }

    if (keywordEl) {
      keywordEl.addEventListener('input', function () {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(function () {
          triggerFilterChange();
        }, 150);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', function (e) {
        e.preventDefault();
        resetFilter();
        if (typeof onResetCallback === 'function') {
          onResetCallback();
        } else {
          triggerFilterChange();
        }
      });
    }
  }

  const FilterView = {
    init: init,
    getFilter: getFilter,
    setFilter: setFilter,
    resetFilter: resetFilter,
    updateCategories: updateCategories,
    hasActiveFilter: hasActiveFilter,
    setOnFilterChange: setOnFilterChange,
    setOnReset: setOnReset
  };

  window.App.FilterView = FilterView;
  window.App.filterView = FilterView;
})();
