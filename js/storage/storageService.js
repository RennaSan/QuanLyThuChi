window.App = window.App || {};

(function () {
  /**
   * Kiểm tra xem localStorage có sẵn sàng và sử dụng được không
   * @returns {boolean}
   */
  function isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !('localStorage' in window) || window.localStorage === null) {
        return false;
      }
      const testKey = '__thuchi_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Kiểm tra lỗi có phải do đầy bộ nhớ localStorage (QuotaExceededError) hay không
   * @param {Error|DOMException} err
   * @returns {boolean}
   */
  function isQuotaExceeded(err) {
    if (!err) return false;
    return (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014 ||
      (typeof err.message === 'string' && err.message.toLowerCase().includes('quota'))
    );
  }

  /**
   * Đảm bảo localStorage khả dụng, nếu không ném lỗi tiếng Việt
   */
  function assertStorageAvailable() {
    if (!isStorageAvailable()) {
      throw new Error('Trình duyệt không hỗ trợ hoặc tính năng localStorage đã bị vô hiệu hóa.');
    }
  }

  /**
   * Lấy cấu hình lưu trữ
   */
  function getConfig() {
    const config = window.App.Config || {};
    return {
      storageKey: config.STORAGE_KEY || 'thuchi.v1',
      corruptKey: config.CORRUPT_STORAGE_KEY || 'thuchi.v1.corrupt',
      schemaVersion: config.SCHEMA_VERSION || 1
    };
  }

  /**
   * Tạo cấu trúc dữ liệu rỗng mặc định
   * @returns {{schemaVersion: number, transactions: Array}}
   */
  function createEmptyData() {
    const { schemaVersion } = getConfig();
    return {
      schemaVersion: schemaVersion,
      transactions: []
    };
  }

  /**
   * Tải dữ liệu từ localStorage
   * - Trả về {schemaVersion, transactions}
   * - Tự tạo dữ liệu rỗng khi chưa có
   * - Khi JSON hỏng: giữ bản hỏng ở khóa "thuchi.v1.corrupt", khởi tạo dữ liệu rỗng và không sập trang
   * @returns {{schemaVersion: number, transactions: Array}}
   */
  function load() {
    assertStorageAvailable();

    const { storageKey, corruptKey, schemaVersion } = getConfig();

    let raw;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch (readErr) {
      throw new Error('Không thể đọc dữ liệu từ localStorage: ' + (readErr.message || 'Lỗi không xác định'));
    }

    // Chưa có dữ liệu: tự tạo và trả về dữ liệu rỗng
    if (raw === null || raw.trim() === '') {
      const emptyData = createEmptyData();
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(emptyData));
      } catch (writeErr) {
        // Bỏ qua nếu chưa ghi được ngay
      }
      return emptyData;
    }

    // Đã có chuỗi dữ liệu, tiến hành phân tích cú pháp JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      // JSON hỏng: sao lưu chuỗi hỏng vào corruptKey và dùng dữ liệu rỗng
      try {
        window.localStorage.setItem(corruptKey, raw);
      } catch (backupErr) {
        console.warn('Không thể lưu bản sao dữ liệu hỏng vào ' + corruptKey + ':', backupErr);
      }

      const fallbackData = createEmptyData();
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(fallbackData));
      } catch (resetErr) {
        // Bỏ qua lỗi ghi đè nếu bộ nhớ bị khóa/lỗi
      }

      console.warn('Dữ liệu lưu trữ bị hỏng định dạng JSON. Đã sao lưu vào "' + corruptKey + '" và sử dụng dữ liệu rỗng.');
      return fallbackData;
    }

    // Kiểm tra cấu trúc dữ liệu cơ bản
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
      try {
        window.localStorage.setItem(corruptKey, raw);
      } catch (backupErr) {
        console.warn('Không thể lưu bản sao dữ liệu sai cấu trúc vào ' + corruptKey + ':', backupErr);
      }

      const fallbackData = createEmptyData();
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(fallbackData));
      } catch (resetErr) {
        // Bỏ qua
      }

      console.warn('Dữ liệu lưu trữ không đúng cấu trúc (thiếu danh sách transactions). Đã sao lưu vào "' + corruptKey + '" và sử dụng dữ liệu rỗng.');
      return fallbackData;
    }

    return {
      schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : schemaVersion,
      transactions: parsed.transactions
    };
  }

  /**
   * Lưu dữ liệu vào localStorage
   * - Ném lỗi QuotaExceededError hoặc lỗi khác với thông điệp tiếng Việt
   * @param {Object} data - Dữ liệu cần lưu {schemaVersion, transactions}
   * @returns {boolean}
   */
  function save(data) {
    assertStorageAvailable();

    if (!data || typeof data !== 'object') {
      throw new Error('Dữ liệu lưu trữ không hợp lệ.');
    }

    if (!Array.isArray(data.transactions)) {
      throw new Error('Dữ liệu không hợp lệ: thuộc tính "transactions" phải là một mảng.');
    }

    const { storageKey, schemaVersion } = getConfig();

    const payload = {
      ...data,
      schemaVersion: typeof data.schemaVersion === 'number' ? data.schemaVersion : schemaVersion,
      transactions: data.transactions
    };

    let serialized;
    try {
      serialized = JSON.stringify(payload);
    } catch (serializeErr) {
      throw new Error('Không thể chuyển đổi dữ liệu sang chuỗi JSON: ' + (serializeErr.message || 'Lỗi không xác định'));
    }

    try {
      window.localStorage.setItem(storageKey, serialized);
      return true;
    } catch (err) {
      if (isQuotaExceeded(err)) {
        throw new Error('Bộ nhớ trình duyệt đã đầy (QuotaExceededError). Không thể lưu thêm dữ liệu.');
      }
      throw new Error('Không thể ghi dữ liệu vào localStorage: ' + (err.message || 'Lỗi không xác định'));
    }
  }

  window.App.StorageService = {
    isAvailable: isStorageAvailable,
    createEmptyData: createEmptyData,
    load: load,
    save: save
  };
})();
