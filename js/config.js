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
})();
