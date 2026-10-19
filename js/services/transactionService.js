window.App = window.App || {};

(function () {
  /**
   * Lấy TransactionRepository từ window.App
   * Đảm bảo tuân thủ chiều gọi: Service -> Repository
   */
  function getRepository() {
    const repo = window.App.TransactionRepository || window.App.transactionRepository;
    if (!repo) {
      throw new Error('Chưa nạp hoặc không tìm thấy TransactionRepository trên window.App.');
    }
    return repo;
  }

  /**
   * Lấy danh sách danh mục hợp lệ theo loại giao dịch (income / expense)
   * @param {string} type
   * @returns {string[]}
   */
  function getCategoriesForType(type) {
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

    if (type === 'expense') {
      return (config.CATEGORIES && config.CATEGORIES.expense) ||
             config.EXPENSE_CATEGORIES ||
             defaultExpense;
    }
    if (type === 'income') {
      return (config.CATEGORIES && config.CATEGORIES.income) ||
             config.INCOME_CATEGORIES ||
             defaultIncome;
    }
    return [];
  }

  /**
   * Kiểm tra ngày hợp lệ và tồn tại trên thực tế (định dạng YYYY-MM-DD)
   * @param {string} dateStr
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateDateString(dateStr) {
    if (typeof dateStr !== 'string' || dateStr.trim() === '') {
      return { valid: false, message: 'Ngày giao dịch không được để trống.' };
    }

    const trimmed = dateStr.trim();
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(trimmed)) {
      return { valid: false, message: 'Ngày giao dịch phải đúng định dạng YYYY-MM-DD.' };
    }

    const parts = trimmed.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (year < 1900 || year > 2100) {
      return { valid: false, message: 'Năm giao dịch không hợp lý (chỉ chấp nhận từ năm 1900 đến 2100).' };
    }

    if (month < 1 || month > 12) {
      return { valid: false, message: 'Tháng giao dịch không hợp lệ (từ 01 đến 12).' };
    }

    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return { valid: false, message: 'Ngày giao dịch không tồn tại trên thực tế (ví dụ: ngày 2026-02-30 hoặc tháng không đủ ngày).' };
    }

    return { valid: true };
  }

  /**
   * Kiểm tra tính hợp lệ của dữ liệu giao dịch
   * Hàm thuần, không chạm DOM
   * @param {Object} input
   * @returns {{ ok: boolean, errors: Object }}
   */
  function validate(input) {
    const errors = {};
    const data = input || {};

    // 1. Kiểm tra type: phải là income hoặc expense
    if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
      errors.type = 'Loại giao dịch không được để trống (phải là "income" hoặc "expense").';
    } else {
      const typeStr = data.type.trim();
      if (typeStr !== 'income' && typeStr !== 'expense') {
        errors.type = 'Loại giao dịch không hợp lệ, phải là "income" (thu nhập) hoặc "expense" (chi phí).';
      }
    }

    // 2. Kiểm tra amount: số nguyên > 0
    if (data.amount === undefined || data.amount === null || data.amount === '') {
      errors.amount = 'Số tiền không được để trống.';
    } else if (typeof data.amount === 'string' && data.amount.trim() === '') {
      errors.amount = 'Số tiền không được để trống.';
    } else if (typeof data.amount === 'boolean') {
      errors.amount = 'Số tiền phải là một số hợp lệ.';
    } else {
      const num = Number(data.amount);
      if (isNaN(num)) {
        errors.amount = 'Số tiền phải là một số hợp lệ.';
      } else if (!Number.isInteger(num)) {
        errors.amount = 'Số tiền phải là số nguyên, không được là số lẻ (thập phân).';
      } else if (num <= 0) {
        errors.amount = 'Số tiền phải là số nguyên lớn hơn 0.';
      }
    }

    // 3. Kiểm tra category: thuộc danh sách của đúng loại
    if (data.category === undefined || data.category === null || (typeof data.category === 'string' && data.category.trim() === '')) {
      errors.category = 'Danh mục không được để trống.';
    } else if (typeof data.category !== 'string') {
      errors.category = 'Danh mục phải là chuỗi ký tự.';
    } else {
      const catTrimmed = data.category.trim();
      const currentType = data.type ? data.type.trim() : '';

      if (currentType === 'income' || currentType === 'expense') {
        const allowedCategories = getCategoriesForType(currentType);
        if (!allowedCategories.includes(catTrimmed)) {
          const typeLabel = currentType === 'income' ? 'thu nhập' : 'chi phí';
          errors.category = 'Danh mục "' + catTrimmed + '" không thuộc danh sách danh mục hợp lệ của loại ' + typeLabel + '.';
        }
      } else {
        errors.category = 'Loại giao dịch không hợp lệ nên không thể xác thực danh mục.';
      }
    }

    // 4. Kiểm tra date: đúng YYYY-MM-DD và là ngày có thật
    const dateCheck = validateDateString(data.date);
    if (!dateCheck.valid) {
      errors.date = dateCheck.message;
    }

    // 5. Kiểm tra note: tối đa 200 ký tự (không bắt buộc)
    if (data.note !== undefined && data.note !== null) {
      const noteStr = String(data.note);
      if (noteStr.length > 200) {
        errors.note = 'Ghi chú không được vượt quá 200 ký tự (hiện có ' + noteStr.length + ' ký tự).';
      }
    }

    return {
      ok: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Chuẩn hóa dữ liệu sau khi xác thực thành công
   * @param {Object} input
   * @returns {Object}
   */
  function sanitizeInput(input) {
    return {
      type: input.type.trim(),
      amount: Number(input.amount),
      category: input.category.trim(),
      date: input.date.trim(),
      note: input.note !== undefined && input.note !== null ? String(input.note).trim() : ''
    };
  }

  /**
   * Thêm giao dịch mới: gọi validate rồi mới gọi repository
   * @param {Object} input
   * @returns {{ ok: boolean, data?: Object, errors?: Object }}
   */
  function add(input) {
    const validation = validate(input);
    if (!validation.ok) {
      return {
        ok: false,
        errors: validation.errors
      };
    }

    const repo = getRepository();
    const payload = sanitizeInput(input);
    const created = repo.create(payload);

    return {
      ok: true,
      data: created
    };
  }

  /**
   * Cập nhật giao dịch: gọi validate rồi mới gọi repository
   * @param {string|Object} idOrInput
   * @param {Object} [changes]
   * @returns {{ ok: boolean, data?: Object, errors?: Object }}
   */
  function update(idOrInput, changes) {
    let id;
    let inputData;

    if (typeof idOrInput === 'string') {
      id = idOrInput;
      inputData = changes || {};
    } else if (typeof idOrInput === 'object' && idOrInput !== null) {
      id = idOrInput.id;
      inputData = idOrInput;
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return {
        ok: false,
        errors: { id: 'Mã giao dịch không hợp lệ hoặc để trống.' }
      };
    }

    const repo = getRepository();
    const existing = repo.getById(id);
    if (!existing) {
      return {
        ok: false,
        errors: { id: 'Không tìm thấy giao dịch cần cập nhật.' }
      };
    }

    // Gộp dữ liệu cũ với thông tin cần sửa để xác thực toàn diện
    const merged = {
      ...existing,
      ...inputData
    };

    const validation = validate(merged);
    if (!validation.ok) {
      return {
        ok: false,
        errors: validation.errors
      };
    }

    const payload = sanitizeInput(merged);
    const updated = repo.update(id, payload);

    return {
      ok: true,
      data: updated
    };
  }

  /**
   * Xóa giao dịch: xác thực id và sự tồn tại rồi mới gọi repository
   * @param {string|Object} idOrInput
   * @returns {{ ok: boolean, data?: Object, errors?: Object }}
   */
  function remove(idOrInput) {
    let id = idOrInput;
    if (typeof idOrInput === 'object' && idOrInput !== null) {
      id = idOrInput.id;
    }

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return {
        ok: false,
        errors: { id: 'Mã giao dịch không hợp lệ hoặc để trống.' }
      };
    }

    const repo = getRepository();
    const existing = repo.getById(id);
    if (!existing) {
      return {
        ok: false,
        errors: { id: 'Không tìm thấy giao dịch cần xóa.' }
      };
    }

    const success = repo.remove(id);
    return {
      ok: success,
      data: existing
    };
  }

  /**
   * Lọc và sắp xếp danh sách giao dịch
   * @param {Object} [filter] - { month: "YYYY-MM", type: "income"|"expense", category: string, keyword: string }
   * @returns {Array} Danh sách đã lọc và sắp xếp theo date giảm dần, cùng ngày thì createdAt giảm dần
   */
  function list(filter) {
    const repo = getRepository();
    const all = repo.getAll();
    const f = filter || {};

    const filtered = all.filter(function (item) {
      if (!item) return false;

      // 1. Lọc theo tháng (YYYY-MM)
      if (f.month && typeof f.month === 'string' && f.month.trim() !== '' && f.month !== 'all') {
        const targetMonth = f.month.trim();
        if (!item.date || !item.date.startsWith(targetMonth)) {
          return false;
        }
      }

      // 2. Lọc theo loại (income / expense)
      if (f.type && typeof f.type === 'string' && f.type.trim() !== '' && f.type !== 'all') {
        if (item.type !== f.type.trim()) {
          return false;
        }
      }

      // 3. Lọc theo danh mục
      if (f.category && typeof f.category === 'string' && f.category.trim() !== '' && f.category !== 'all') {
        if (item.category !== f.category.trim()) {
          return false;
        }
      }

      // 4. Lọc theo từ khóa (tìm trong ghi chú và danh mục)
      if (f.keyword && typeof f.keyword === 'string' && f.keyword.trim() !== '') {
        const kw = f.keyword.trim().toLowerCase();
        const note = (item.note || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        if (!note.includes(kw) && !category.includes(kw)) {
          return false;
        }
      }

      return true;
    });

    // Sắp xếp: date giảm dần, cùng ngày thì createdAt giảm dần
    filtered.sort(function (a, b) {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }

      const createdA = a.createdAt || '';
      const createdB = b.createdAt || '';
      return createdB.localeCompare(createdA);
    });

    return filtered;
  }

  /**
   * Tổng hợp thu, chi và số dư từ một danh sách giao dịch
   * Hàm thuần, không chạm DOM
   * @param {Array} [transactionList]
   * @returns {{ totalIncome: number, totalExpense: number, balance: number }}
   */
  function summarize(transactionList) {
    let items;
    if (Array.isArray(transactionList)) {
      items = transactionList;
    } else if (transactionList && typeof transactionList === 'object') {
      items = [transactionList];
    } else {
      items = getRepository().getAll();
    }

    let totalIncome = 0;
    let totalExpense = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const amount = Number(item.amount) || 0;
      if (item.type === 'income') {
        totalIncome += amount;
      } else if (item.type === 'expense') {
        totalExpense += amount;
      }
    }

    return {
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      balance: totalIncome - totalExpense
    };
  }

  const TransactionService = {
    validate: validate,
    add: add,
    update: update,
    remove: remove,
    list: list,
    summarize: summarize,
    getById: function (id) {
      return getRepository().getById(id);
    }
  };

  window.App.TransactionService = TransactionService;
  window.App.transactionService = TransactionService;
})();
