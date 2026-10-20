window.App = window.App || {};

(function () {
  let isInitialized = false;



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
   * Hiển thị thông báo Toast phong cách nhãn dán xanh Scrapbook bằng textContent (không dùng innerHTML)
   * Vị trí (mục 05): mobile ở dưới giữa màn hình, tablet/desktop ở trên phải không che navbar, có nút đóng
   * Hỗ trợ chuỗi thông báo hoặc mảng thông báo lỗi (tối đa 5 lỗi)
   * @param {string|string[]} message
   * @param {string} [type='warning']
   */
  function showToast(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast z-50';
      document.body.appendChild(container);
    }

    const isError = type === 'error';
    const isSuccess = type === 'success';

    const alertDiv = document.createElement('div');
    alertDiv.className = 'toast-sticker shadow-lg flex items-start gap-2.5 w-full text-left p-3.5 sm:p-4' + (isError ? ' toast-sticker-error' : '');
    alertDiv.setAttribute('role', 'alert');

    // Cụm icon nhận diện loại thông báo
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'p-1 rounded-full bg-white/20 shrink-0 mt-0.5 pointer-events-none';

    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'h-4 w-4 shrink-0 stroke-current text-white pointer-events-none');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');

    if (isSuccess) {
      path.setAttribute('d', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
    } else if (isError) {
      path.setAttribute('d', 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z');
    } else {
      path.setAttribute('d', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z');
    }

    iconSvg.appendChild(path);
    iconWrapper.appendChild(iconSvg);
    alertDiv.appendChild(iconWrapper);

    // Cụm nội dung thông báo
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex-1 min-w-0 pr-1';

    if (Array.isArray(message)) {
      const titleSpan = document.createElement('div');
      titleSpan.className = 'font-bold text-xs sm:text-sm text-white mb-1';
      titleSpan.textContent = 'Từ chối file (phát hiện lỗi):';
      contentDiv.appendChild(titleSpan);

      const ul = document.createElement('ul');
      ul.className = 'list-disc list-inside text-xs text-white/95 space-y-1 pl-0.5';
      message.slice(0, 5).forEach(function (errText) {
        const li = document.createElement('li');
        li.textContent = errText;
        ul.appendChild(li);
      });
      contentDiv.appendChild(ul);
    } else {
      const span = document.createElement('div');
      span.className = 'text-xs sm:text-sm font-medium text-white leading-snug break-words';
      span.textContent = message;
      contentDiv.appendChild(span);
    }
    alertDiv.appendChild(contentDiv);

    // Nút đóng thủ công (✕) với vùng chạm >= 40px
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-ghost btn-xs text-white/90 hover:text-white hover:bg-white/25 rounded-full h-10 w-10 min-h-[40px] min-w-[40px] p-0 shrink-0 inline-flex items-center justify-center transition-all cursor-pointer hover:rotate-90';
    closeBtn.setAttribute('aria-label', 'Đóng thông báo');

    const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('class', 'h-4 w-4 stroke-current pointer-events-none');
    closeSvg.setAttribute('fill', 'none');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('aria-hidden', 'true');
    const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closePath.setAttribute('stroke-linecap', 'round');
    closePath.setAttribute('stroke-linejoin', 'round');
    closePath.setAttribute('stroke-width', '2.2');
    closePath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    closeSvg.appendChild(closePath);
    closeBtn.appendChild(closeSvg);

    alertDiv.appendChild(closeBtn);
    container.appendChild(alertDiv);

    let isDismissed = false;

    function dismissToast() {
      if (isDismissed) return;
      isDismissed = true;
      clearTimeout(displayTimer);
      alertDiv.style.opacity = '0';
      alertDiv.style.transform = 'scale(0.88) translateY(-6px)';
      alertDiv.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(function () {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
        if (container.children.length === 0 && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 250);
    }

    closeBtn.addEventListener('click', dismissToast);

    // Thời gian hiển thị (lỗi danh sách giữ lâu hơn để đọc)
    const displayDuration = Array.isArray(message) ? 6000 : 3500;
    const displayTimer = setTimeout(dismissToast, displayDuration);
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
