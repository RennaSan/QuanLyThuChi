window.App = window.App || {};

(function () {
  /**
   * Tạo mã định danh duy nhất (UUID v4 nếu có, nếu không thì thời gian + số ngẫu nhiên)
   * @returns {string}
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  /**
   * Tạo một đối tượng giao dịch từ dữ liệu nhập
   * @param {Object} input
   * @returns {Object}
   */
  function create(input) {
    const data = input || {};
    const now = new Date().toISOString();

    return {
      id: data.id || generateId(),
      type: data.type,
      amount: data.amount,
      category: data.category,
      date: data.date,
      note: data.note !== undefined && data.note !== null ? data.note : '',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }

  /**
   * Hàm khởi tạo / bao bọc Model Transaction
   */
  function Transaction(input) {
    if (!(this instanceof Transaction)) {
      return create(input);
    }
    Object.assign(this, create(input));
  }

  Transaction.create = create;
  Transaction.generateId = generateId;

  window.App.Transaction = Transaction;
  window.App.transaction = Transaction;
})();
