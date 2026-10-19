window.App = window.App || {};

(function () {


  /**
   * Lấy đối tượng TransactionService từ window.App
   * Tuân thủ chiều gọi: Controller -> Service
   */
  function getService() {
    const service = window.App.TransactionService || window.App.transactionService;
    if (!service) {
      throw new Error('Chưa nạp hoặc không tìm thấy TransactionService trên window.App.');
    }
    return service;
  }

  /**
   * Lấy SummaryView từ window.App
   */
  function getSummaryView() {
    return window.App.SummaryView || window.App.summaryView;
  }

  /**
   * Lấy TransactionListView từ window.App
   */
  function getTransactionListView() {
    return window.App.TransactionListView || window.App.transactionListView;
  }

  /**
   * Lấy TransactionFormView từ window.App
   */
  function getFormView() {
    return window.App.TransactionFormView || window.App.transactionFormView;
  }

  /**
   * Lấy DeleteConfirmView từ window.App
   */
  function getDeleteConfirmView() {
    return window.App.DeleteConfirmView || window.App.deleteConfirmView;
  }

  /**
   * Lấy FilterView từ window.App
   */
  function getFilterView() {
    return window.App.FilterView || window.App.filterView;
  }

  /**
   * Kiểm tra xem bộ lọc có đang được kích hoạt hay không
   * @param {Object} [filter]
   * @returns {boolean}
   */
  function isFilterActive(filter) {
    if (!filter) return false;
    const hasMonth = filter.month && filter.month.trim() !== '' && filter.month !== 'all';
    const hasType = filter.type && filter.type.trim() !== '' && filter.type !== 'all';
    const hasCategory = filter.category && filter.category.trim() !== '' && filter.category !== 'all';
    const hasKeyword = filter.keyword && filter.keyword.trim() !== '';
    return Boolean(hasMonth || hasType || hasCategory || hasKeyword);
  }

  /**
   * Xử lý khi nhấn nút Thêm giao dịch đầu trang
   */
  function handleOpenAdd() {
    const formView = getFormView();
    if (formView && typeof formView.openAdd === 'function') {
      formView.openAdd();
    }
  }

  /**
   * Xử lý khi nhấn nút Sửa trên một dòng giao dịch
   * @param {string} id
   */
  function handleOpenEdit(id) {
    const service = getService();
    const formView = getFormView();
    if (!service || !formView) return;

    const transaction = service.getById(id);
    if (transaction && typeof formView.openEdit === 'function') {
      formView.openEdit(transaction);
    }
  }

  /**
   * Xử lý khi nhấn nút Xóa trên một dòng giao dịch
   * Mở modal DaisyUI hiển thị ngày, số tiền, danh mục của bản ghi sắp xóa
   * @param {string} id
   */
  function handleOpenDelete(id) {
    const service = getService();
    const deleteView = getDeleteConfirmView();
    if (!service || !deleteView) return;

    if (typeof deleteView.setOnConfirm === 'function') {
      deleteView.setOnConfirm(handleConfirmDelete);
    }

    const transaction = service.getById(id);
    if (transaction && typeof deleteView.open === 'function') {
      deleteView.open(transaction, handleConfirmDelete);
    }
  }

  /**
   * Xử lý khi người dùng đồng ý xóa giao dịch trong modal
   * Đồng ý → xóa qua service rồi cập nhật danh sách và tổng quan
   * @param {string} id
   */
  function handleConfirmDelete(id) {
    const service = getService();
    const deleteView = getDeleteConfirmView();
    if (!service) return;

    const result = service.remove(id);
    if (result && result.ok) {
      if (deleteView && typeof deleteView.close === 'function') {
        deleteView.close();
      }
      refresh();
    }
  }

  /**
   * Xử lý submit form thêm/sửa giao dịch
   * Kiểm tra kết quả từ service: lỗi -> hiển thị ngay dưới trường; thành công -> đóng form, cập nhật giao diện
   * @param {Object} formData
   */
  function handleSubmit(formData) {
    const service = getService();
    const formView = getFormView();
    if (!service || !formView) return;

    let result;
    if (formData.id) {
      result = service.update(formData.id, formData);
    } else {
      result = service.add(formData);
    }

    if (!result.ok) {
      if (typeof formView.showErrors === 'function') {
        formView.showErrors(result.errors);
      }
      return;
    }

    if (typeof formView.close === 'function') {
      formView.close();
    }
    refresh();
  }

  /**
   * Xử lý khi bộ lọc thay đổi
   */
  function handleFilterChange() {
    refresh();
  }

  /**
   * Xử lý khi bấm nút Xóa lọc
   */
  function handleResetFilter() {
    refresh();
  }

  /**
   * Tải dữ liệu qua service và điều phối hiển thị lên các view
   * Chiều gọi: Controller -> Service -> View
   */
  function refresh() {
    const service = getService();
    const summaryView = getSummaryView();
    const listView = getTransactionListView();
    const filterView = getFilterView();

    // 1. Controller lấy bộ lọc hiện tại (nếu có)
    const currentFilter = filterView && typeof filterView.getFilter === 'function'
      ? filterView.getFilter()
      : {};

    // 2. Controller lấy dữ liệu từ service (đã lọc và sắp xếp)
    const transactions = service.list(currentFilter);
    const summary = service.summarize(transactions);

    // 3. Controller gọi view để vẽ lại giao diện
    if (summaryView && typeof summaryView.render === 'function') {
      summaryView.render(summary);
    }

    if (listView && typeof listView.render === 'function') {
      const emptyMessage = (transactions.length === 0 && isFilterActive(currentFilter))
        ? 'Không có giao dịch phù hợp'
        : 'Chưa có giao dịch';
      listView.render(transactions, null, { emptyMessage: emptyMessage });
    }
  }

  /**
   * Khởi tạo controller khi trang sẵn sàng
   */
  function init() {

    const formView = getFormView();
    if (formView) {
      if (typeof formView.init === 'function') {
        formView.init();
      }
      if (typeof formView.setOnSubmit === 'function') {
        formView.setOnSubmit(handleSubmit);
      }
    }

    const deleteView = getDeleteConfirmView();
    if (deleteView) {
      if (typeof deleteView.init === 'function') {
        deleteView.init();
      }
      if (typeof deleteView.setOnConfirm === 'function') {
        deleteView.setOnConfirm(handleConfirmDelete);
      }
    }

    const listView = getTransactionListView();
    if (listView) {
      if (typeof listView.setOnEdit === 'function') {
        listView.setOnEdit(handleOpenEdit);
      }
      if (typeof listView.setOnDelete === 'function') {
        listView.setOnDelete(handleOpenDelete);
      }
    }

    const filterView = getFilterView();
    if (filterView) {
      if (typeof filterView.init === 'function') {
        filterView.init();
      }
      if (typeof filterView.setOnFilterChange === 'function') {
        filterView.setOnFilterChange(handleFilterChange);
      }
      if (typeof filterView.setOnReset === 'function') {
        filterView.setOnReset(handleResetFilter);
      }
    }

    const btnAdd = document.getElementById('btn-add-transaction') || document.getElementById('btn-open-modal');
    if (btnAdd) {
      btnAdd.addEventListener('click', handleOpenAdd);
    }

    refresh();
  }

  const TransactionController = {
    init: init,
    refresh: refresh,
    handleOpenAdd: handleOpenAdd,
    handleOpenEdit: handleOpenEdit,
    handleOpenDelete: handleOpenDelete,
    handleConfirmDelete: handleConfirmDelete,
    handleSubmit: handleSubmit,
    handleFilterChange: handleFilterChange,
    handleResetFilter: handleResetFilter
  };

  window.App.TransactionController = TransactionController;
  window.App.transactionController = TransactionController;
})();
