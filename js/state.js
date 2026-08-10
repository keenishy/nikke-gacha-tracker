export const state = {
    allHistoryRecords: [],
    currentHistoryAccount: '1 케니',
    currentEditId: null,
    savedScrollPosition: null,
    pullData: {},
    currentPage: 1,
    ACCOUNT_LIST: ['1 케니', '2 키니시', '3 키니', '4 키치', '5 키시', '6 키키', '7 키피'],
    
    // Pagination config
    totalPulls: 1000,
    pullsPerPage: 100,
    get totalPages() {
        return Math.ceil(this.totalPulls / this.pullsPerPage);
    }
};