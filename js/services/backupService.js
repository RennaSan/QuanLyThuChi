window.App = window.App || {};

(function () {


  /**
   * Lấy TransactionRepository từ window.App
   * Tuân thủ chiều gọi: Service -> Repository
   */
  function getRepository() {
    return window.App.TransactionRepository || window.App.transactionRepository;
  }

  /**
   * Lấy StorageService từ window.App
   */
  function getStorageService() {
    return window.App.StorageService || window.App.storageService;
  }

  /**
   * Lấy cấu hình hệ thống
   */
  function getConfig() {
    return window.App.Config || {};
  }

  /**
   * Lấy danh sách tất cả giao dịch từ Repository
   * @returns {Array}
   */
  function getAllTransactions() {
    const repo = getRepository();
    if (repo && typeof repo.getAll === 'function') {
      return repo.getAll();
    }
    return [];
  }

  /**
   * Kiểm tra xem có giao dịch nào để xuất hay không
   * @returns {boolean}
   */
  function hasData() {
    const list = getAllTransactions();
    return Array.isArray(list) && list.length > 0;
  }

  /**
   * Tạo tên file backup theo định dạng: thuchi-backup-YYYYMMDD-HHmm.json
   * @param {Date} [date]
   * @returns {string}
   */
  function generateFilename(date) {
    const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    const pad = function (n) {
      return String(n).padStart(2, '0');
    };
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return 'thuchi-backup-' + yyyy + mm + dd + '-' + hh + min + '.json';
  }

  /**
   * Tạo cấu trúc dữ liệu xuất: đúng cấu trúc dữ liệu trong PROJECT_STATE.md + exportedAt (ISO)
   * @returns {{ schemaVersion: number, transactions: Array, exportedAt: string }}
   */
  function createExportPayload() {
    const config = getConfig();
    const storageService = getStorageService();
    let schemaVersion = config.SCHEMA_VERSION || 1;

    if (storageService && typeof storageService.load === 'function') {
      const data = storageService.load();
      if (data && typeof data.schemaVersion === 'number') {
        schemaVersion = data.schemaVersion;
      }
    }

    const transactions = getAllTransactions();
    const exportedAt = new Date().toISOString();

    return {
      schemaVersion: schemaVersion,
      transactions: transactions,
      exportedAt: exportedAt
    };
  }

  /**
   * Lấy TransactionService từ window.App
   */
  function getTransactionService() {
    return window.App.TransactionService || window.App.transactionService;
  }

  /**
   * Chuẩn bị dữ liệu xuất ra file JSON (thụt lề 2 khoảng trắng)
   * Hàm thuần, không chạm DOM
   * @returns {{ ok: boolean, filename?: string, jsonString?: string, payload?: Object, count?: number, error?: string }}
   */
  function exportData() {
    if (!hasData()) {
      return {
        ok: false,
        error: 'Chưa có dữ liệu để xuất'
      };
    }

    const payload = createExportPayload();
    const filename = generateFilename();
    const jsonString = JSON.stringify(payload, null, 2);

    return {
      ok: true,
      filename: filename,
      jsonString: jsonString,
      payload: payload,
      count: payload.transactions.length
    };
  }

  /**
   * Kiểm tra và thẩm định toàn diện dữ liệu JSON nhập vào
   * Hàm thuần, không chạm DOM
   * @param {string} jsonString
   * @returns {{ ok: boolean, data?: { schemaVersion: number, transactions: Array }, count?: number, errors?: string[], totalErrorCount?: number }}
   */
  function validateImport(jsonString) {
    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
      return {
        ok: false,
        errors: ['File trống hoặc không có nội dung.'],
        totalErrorCount: 1
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      return {
        ok: false,
        errors: ['Cú pháp JSON không hợp lệ: ' + (e.message || 'Lỗi phân tích cú pháp')],
        totalErrorCount: 1
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        ok: false,
        errors: ['Dữ liệu trong file JSON phải là một đối tượng (object).'],
        totalErrorCount: 1
      };
    }

    const allErrors = [];

    // 1. Kiểm tra schemaVersion = 1
    if (parsed.schemaVersion !== 1) {
      allErrors.push(
        'Phiên bản dữ liệu không hợp lệ: schemaVersion phải là 1' +
        (parsed.schemaVersion !== undefined ? ' (nhận được ' + String(parsed.schemaVersion) + ')' : ' (không có schemaVersion)') + '.'
      );
    }

    // 2. Kiểm tra transactions là mảng
    if (!Array.isArray(parsed.transactions)) {
      allErrors.push('Dữ liệu không hợp lệ: thuộc tính "transactions" phải là một mảng.');
    } else {
      const seenIds = new Set();
      const txService = getTransactionService();

      for (let i = 0; i < parsed.transactions.length; i++) {
        const item = parsed.transactions[i];
        const rowLabel = 'Giao dịch #' + (i + 1);

        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          allErrors.push(rowLabel + ': Dữ liệu phần tử không phải đối tượng hợp lệ.');
          continue;
        }

        // a. Kiểm tra id
        if (item.id === undefined || item.id === null || String(item.id).trim() === '') {
          allErrors.push(rowLabel + ': Thiếu thuộc tính "id" hoặc id rỗng.');
        } else {
          const idStr = String(item.id).trim();
          if (seenIds.has(idStr)) {
            allErrors.push(rowLabel + ': Trùng lặp id "' + idStr + '" trong file.');
          } else {
            seenIds.add(idStr);
          }
        }

        // b. Kiểm tra createdAt
        if (item.createdAt === undefined || item.createdAt === null || String(item.createdAt).trim() === '') {
          allErrors.push(rowLabel + ': Thiếu thuộc tính "createdAt".');
        } else {
          const createdTime = Date.parse(String(item.createdAt));
          if (isNaN(createdTime)) {
            allErrors.push(rowLabel + ': Thuộc tính "createdAt" không phải định dạng ngày hợp lệ.');
          }
        }

        // c. Kiểm tra updatedAt
        if (item.updatedAt === undefined || item.updatedAt === null || String(item.updatedAt).trim() === '') {
          allErrors.push(rowLabel + ': Thiếu thuộc tính "updatedAt".');
        } else {
          const updatedTime = Date.parse(String(item.updatedAt));
          if (isNaN(updatedTime)) {
            allErrors.push(rowLabel + ': Thuộc tính "updatedAt" không phải định dạng ngày hợp lệ.');
          }
        }

        // d. Qua service.validate
        if (txService && typeof txService.validate === 'function') {
          const valResult = txService.validate(item);
          if (!valResult || !valResult.ok) {
            const valErrors = (valResult && valResult.errors) || {};
            for (const key in valErrors) {
              if (Object.prototype.hasOwnProperty.call(valErrors, key)) {
                allErrors.push(rowLabel + ': ' + valErrors[key]);
              }
            }
          }
        }
      }
    }

    if (allErrors.length > 0) {
      return {
        ok: false,
        errors: allErrors.slice(0, 5),
        totalErrorCount: allErrors.length
      };
    }

    // Làm sạch và chuẩn hóa danh sách giao dịch, bỏ qua exportedAt
    const cleanTransactions = parsed.transactions.map(function (item) {
      return {
        id: String(item.id).trim(),
        type: String(item.type).trim(),
        amount: Number(item.amount),
        category: String(item.category).trim(),
        date: String(item.date).trim(),
        note: item.note !== undefined && item.note !== null ? String(item.note) : '',
        createdAt: String(item.createdAt).trim(),
        updatedAt: String(item.updatedAt).trim()
      };
    });

    return {
      ok: true,
      data: {
        schemaVersion: 1,
        transactions: cleanTransactions
      },
      count: cleanTransactions.length
    };
  }

  /**
   * Áp dụng ghi đè dữ liệu nhập vào kho lưu trữ qua StorageService
   * Tuân thủ chiều gọi: Service -> StorageService -> localStorage
   * @param {Object|Array} dataOrTransactions
   * @returns {boolean}
   */
  function applyImport(dataOrTransactions) {
    const storageService = getStorageService();
    if (!storageService) {
      throw new Error('Chưa nạp hoặc không tìm thấy StorageService trên window.App.');
    }

    let transactions = [];
    if (Array.isArray(dataOrTransactions)) {
      transactions = dataOrTransactions;
    } else if (dataOrTransactions && Array.isArray(dataOrTransactions.transactions)) {
      transactions = dataOrTransactions.transactions;
    } else {
      throw new Error('Dữ liệu nhập không hợp lệ: thiếu danh sách giao dịch.');
    }

    const config = getConfig();
    const payload = {
      schemaVersion: config.SCHEMA_VERSION || 1,
      transactions: transactions
    };

    return storageService.save(payload);
  }

  const BackupService = {
    hasData: hasData,
    generateFilename: generateFilename,
    createExportPayload: createExportPayload,
    exportData: exportData,
    getAllTransactions: getAllTransactions,
    validateImport: validateImport,
    validateImportData: validateImport,
    applyImport: applyImport
  };

  window.App.BackupService = BackupService;
  window.App.backupService = BackupService;
})();
