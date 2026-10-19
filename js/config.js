window.App = window.App || {};

(function () {
  const EXPENSE_CATEGORIES = Object.freeze([
    'Ăn uống',
    'Di chuyển',
    'Nhà ở',
    'Học tập',
    'Giải trí',
    'Sức khỏe',
    'Khác'
  ]);

  const INCOME_CATEGORIES = Object.freeze([
    'Lương',
    'Thưởng',
    'Khác'
  ]);

  window.App.Config = Object.freeze({
    STORAGE_KEY: 'thuchi.v1',
    CORRUPT_STORAGE_KEY: 'thuchi.v1.corrupt',
    SCHEMA_VERSION: 1,
    CATEGORIES: Object.freeze({
      expense: EXPENSE_CATEGORIES,
      income: INCOME_CATEGORIES
    }),
    EXPENSE_CATEGORIES: EXPENSE_CATEGORIES,
    INCOME_CATEGORIES: INCOME_CATEGORIES
  });

  /**
   * Định dạng số tiền theo chuẩn vi-VN (VND, số nguyên) dùng chung toàn ứng dụng
   * @param {number|string} amount
   * @returns {string}
   */
  window.App.formatCurrency = function (amount) {
    const num = Math.round(Number(amount)) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  };

  /**
   * Lấy danh sách danh mục theo loại dùng chung
   * @param {string} type - 'expense' | 'income' | 'all'
   * @returns {string[]}
   */
  window.App.getCategories = function (type) {
    if (type === 'expense') {
      return EXPENSE_CATEGORIES;
    }
    if (type === 'income') {
      return INCOME_CATEGORIES;
    }
    const combined = [];
    EXPENSE_CATEGORIES.forEach(function (cat) {
      if (!combined.includes(cat)) combined.push(cat);
    });
    INCOME_CATEGORIES.forEach(function (cat) {
      if (!combined.includes(cat)) combined.push(cat);
    });
    return combined;
  };
})();
