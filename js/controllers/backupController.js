window.App = window.App || {};

(function () {
  let isInitialized = false;

  /**
   * Đảm bảo importConfirmView.js được nạp vào tài liệu nếu chưa có thẻ script
   */
  function ensureImportConfirmViewLoaded() {
    if (typeof document === 'undefined') return;
    if (window.App.ImportConfirmView || window.App.importConfirmView) return;
    if (document.querySelector('script[src*="importConfirmView.js"]')) return;

    let scriptUrl = 'js/views/importConfirmView.js';
    try {
      if (document.currentScript && document.currentScript.src) {
        scriptUrl = document.currentScript.src.replace(/controllers\/backupController\.js(\?.*)?$/i, 'views/importConfirmView.js$1');
      }
    } catch (e) {
      // Fallback mặc định
    }

    if (document.readyState === 'loading') {
      document.write('<script src="' + scriptUrl + '"><\/script>');
    } else {
      const script = document.createElement('script');
      script.src = scriptUrl;
      document.head.appendChild(script);
    }
  }

  ensureImportConfirmViewLoaded();

  /**
   * Lấy đối tượng BackupService từ window.App
   * Tuân thủ chiều gọi: Controller -> Service
   */
  function getService() {
    return window.App.BackupService || window.App.backupService;
  }

  /**
   * Lấy view ImportConfirmView từ window.App
   */
  function getImportConfirmView() {
    return window.App.ImportConfirmView || window.App.importConfirmView;
  }

  /**
   * Lấy TransactionController để cập nhật giao diện sau khi nhập
   */
  function getTransactionController() {
    return window.App.TransactionController || window.App.transactionController;
  }

  /**
   * Hiển thị thông báo Toast chuẩn DaisyUI bằng textContent (không dùng innerHTML)
   * Hỗ trợ chuỗi thông báo hoặc mảng thông báo lỗi (tối đa 5 lỗi)
   * @param {string|string[]} message
   * @param {string} [type='warning']
   */
  function showToast(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast toast-top toast-end z-50 p-4 max-w-md';
      document.body.appendChild(container);
    }

    const alertTypeClass = type === 'error'
      ? 'alert-error'
      : (type === 'success' ? 'alert-success' : 'alert-warning');

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert ' + alertTypeClass + ' shadow-lg flex flex-col items-start gap-2 w-full text-left';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex items-center gap-2 w-full';

    // SVG icon cảnh báo / thành công
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'h-5 w-5 shrink-0 stroke-current');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');

    if (type === 'success') {
      path.setAttribute('d', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
    } else if (type === 'error') {
      path.setAttribute('d', 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z');
    } else {
      path.setAttribute('d', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z');
    }

    iconSvg.appendChild(path);
    headerDiv.appendChild(iconSvg);

    if (Array.isArray(message)) {
      const titleSpan = document.createElement('span');
      titleSpan.className = 'font-bold text-sm';
      titleSpan.textContent = 'Từ chối file (phát hiện lỗi):';
      headerDiv.appendChild(titleSpan);
      alertDiv.appendChild(headerDiv);

      const ul = document.createElement('ul');
      ul.className = 'list-disc list-inside text-xs space-y-1 pl-1';
      message.slice(0, 5).forEach(function (errText) {
        const li = document.createElement('li');
        li.textContent = errText;
        ul.appendChild(li);
      });
      alertDiv.appendChild(ul);
    } else {
      const span = document.createElement('span');
      span.className = 'text-sm';
      span.textContent = message;
      headerDiv.appendChild(span);
      alertDiv.appendChild(headerDiv);
    }

    container.appendChild(alertDiv);

    // Thời gian hiển thị (lỗi danh sách giữ lâu hơn để đọc)
    const displayDuration = Array.isArray(message) ? 6000 : 3500;

    setTimeout(function () {
      alertDiv.style.opacity = '0';
      alertDiv.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
        if (container.children.length === 0 && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 300);
    }, displayDuration);
  }

  /**
   * Tạo file tải về bằng Blob và thẻ <a download>
   * @param {string} filename
   * @param {string} jsonString
   */
  function triggerDownload(filename, jsonString) {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(function () {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 150);
  }

  /**
   * Xử lý sự kiện khi người dùng bấm nút "Xuất dữ liệu"
   */
  function handleExport() {
    const service = getService();
    if (!service) {
      console.error('Chưa nạp hoặc không tìm thấy BackupService trên window.App.');
      return;
    }

    if (typeof service.hasData === 'function' && !service.hasData()) {
      showToast('Chưa có dữ liệu để xuất', 'warning');
      return;
    }

    const result = service.exportData();
    if (!result || !result.ok) {
      showToast(result && result.error ? result.error : 'Chưa có dữ liệu để xuất', 'warning');
      return;
    }

    triggerDownload(result.filename, result.jsonString);
  }

  /**
   * Xử lý nội dung file JSON đọc được từ FileReader
   * @param {string} fileContent
   */
  function processImportContent(fileContent) {
    const service = getService();
    if (!service) {
      showToast('Hệ thống chưa sẵn sàng (thiếu BackupService).', 'error');
      return;
    }

    // 1. Kiểm tra trọn gói bằng service
    const validationResult = service.validateImport(fileContent);

    // Sai bất kỳ điều gì -> từ chối CẢ file, hiện tối đa 5 lỗi đầu, dữ liệu hiện tại KHÔNG đổi
    if (!validationResult || !validationResult.ok) {
      const errors = (validationResult && validationResult.errors) || ['Dữ liệu file không hợp lệ.'];
      showToast(errors, 'error');
      return;
    }

    // 2. File hợp lệ -> mở hộp xác nhận thay thế
    const currentList = (typeof service.getAllTransactions === 'function')
      ? service.getAllTransactions()
      : [];
    const currentCount = Array.isArray(currentList) ? currentList.length : 0;
    const newCount = validationResult.count || 0;

    const confirmView = getImportConfirmView();
    if (!confirmView || typeof confirmView.open !== 'function') {
      showToast('Không thể hiển thị hộp thoại xác nhận.', 'error');
      return;
    }

    confirmView.open({ currentCount: currentCount, newCount: newCount }, function () {
      // 3. Người dùng Đồng ý -> Ghi qua storageService rồi cập nhật giao diện
      try {
        service.applyImport(validationResult.data);

        // Cập nhật giao diện thông qua TransactionController
        const txController = getTransactionController();
        if (txController && typeof txController.refresh === 'function') {
          txController.refresh();
        }

        showToast('Đã thay thế ' + currentCount + ' giao dịch bằng ' + newCount + ' giao dịch từ file.', 'success');
      } catch (err) {
        showToast('Lỗi khi lưu dữ liệu: ' + (err.message || 'Lỗi không xác định'), 'error');
      }
    });
  }

  /**
   * Xử lý khi người dùng chọn file JSON
   * @param {Event} e
   */
  function handleFileSelected(e) {
    const fileInput = e.target;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      const content = event.target.result;
      processImportContent(content);
    };

    reader.onerror = function () {
      showToast('Không thể đọc file đã chọn.', 'error');
    };

    reader.readAsText(file, 'utf-8');

    // Reset giá trị input để có thể chọn lại cùng một file nếu cần
    fileInput.value = '';
  }

  /**
   * Khởi tạo controller: gắn sự kiện cho các nút trên navbar
   */
  function init() {
    if (isInitialized) return;

    ensureImportConfirmViewLoaded();

    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', handleExport);
    }

    const btnImport = document.getElementById('btn-import-data');
    const inputImport = document.getElementById('input-import-file');

    if (btnImport && inputImport) {
      btnImport.addEventListener('click', function () {
        inputImport.click();
      });
      inputImport.addEventListener('change', handleFileSelected);
    }

    isInitialized = true;
  }

  const BackupController = {
    init: init,
    handleExport: handleExport,
    processImportContent: processImportContent,
    showToast: showToast,
    triggerDownload: triggerDownload
  };

  window.App.BackupController = BackupController;
  window.App.backupController = BackupController;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
