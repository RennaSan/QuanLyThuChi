window.App = window.App || {};

(function () {
  /**
   * Khởi chạy toàn bộ ứng dụng
   */
  function init() {
    const controller = window.App.TransactionController || window.App.transactionController;
    if (controller && typeof controller.init === 'function') {
      controller.init();
    }
  }

  window.App.init = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
