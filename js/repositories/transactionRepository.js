window.App = window.App || {};

(function () {
  /**
   * Lấy đối tượng StorageService từ window.App
   * Tuân thủ quy tắc: Repository chỉ làm việc qua storageService, không gọi localStorage trực tiếp
   */
  function getStorageService() {
    const service = window.App.StorageService || window.App.storageService;
    if (!service) {
      throw new Error('Chưa nạp hoặc không tìm thấy StorageService trên window.App.');
    }
    return service;
  }

  /**
   * Lấy tất cả các giao dịch
   * @returns {Array} Danh sách các giao dịch
   */
  function getAll() {
    const storageService = getStorageService();
    const data = storageService.load();
    return Array.isArray(data.transactions) ? [...data.transactions] : [];
  }

  /**
   * Lấy một giao dịch theo id
   * @param {string} id
   * @returns {Object|null} Giao dịch tìm thấy hoặc null nếu không tồn tại
   */
  function getById(id) {
    if (!id) return null;
    const transactions = getAll();
    const found = transactions.find(function (item) {
      return item.id === id;
    });
    return found || null;
  }

  /**
   * Tạo mới một giao dịch và lưu vào bộ nhớ
   * @param {Object} input - Dữ liệu giao dịch nhập vào
   * @returns {Object} Giao dịch đã được khởi tạo và lưu trữ
   */
  function create(input) {
    const model = window.App.Transaction || window.App.transaction;
    const transaction = (model && typeof model.create === 'function')
      ? model.create(input)
      : (typeof model === 'function' ? model(input) : { ...input });

    const storageService = getStorageService();
    const data = storageService.load();
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    transactions.push(transaction);
    data.transactions = transactions;
    storageService.save(data);

    return transaction;
  }

  /**
   * Cập nhật một giao dịch (giữ id và createdAt, cập nhật updatedAt)
   * @param {string} id - Id của giao dịch cần sửa
   * @param {Object} changes - Các thông tin cần thay đổi
   * @returns {Object|null} Giao dịch sau khi sửa hoặc null nếu không tìm thấy id
   */
  function update(id, changes) {
    if (!id) return null;

    const storageService = getStorageService();
    const data = storageService.load();
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    const index = transactions.findIndex(function (item) {
      return item.id === id;
    });

    if (index === -1) {
      return null;
    }

    const existing = transactions[index];
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      ...(changes || {}),
      id: existing.id,
      createdAt: existing.createdAt || now,
      updatedAt: now
    };

    transactions[index] = updated;
    data.transactions = transactions;
    storageService.save(data);

    return updated;
  }

  /**
   * Xóa một giao dịch theo id
   * @param {string} id - Id của giao dịch cần xóa
   * @returns {boolean} true nếu xóa thành công, false nếu không tìm thấy
   */
  function remove(id) {
    if (!id) return false;

    const storageService = getStorageService();
    const data = storageService.load();
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    const index = transactions.findIndex(function (item) {
      return item.id === id;
    });

    if (index === -1) {
      return false;
    }

    transactions.splice(index, 1);
    data.transactions = transactions;
    storageService.save(data);

    return true;
  }

  const TransactionRepository = {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    remove: remove
  };

  window.App.TransactionRepository = TransactionRepository;
  window.App.transactionRepository = TransactionRepository;
})();
