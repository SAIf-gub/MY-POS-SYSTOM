// Sales data management
const Sales = {
    data: [],
    receipts: [],

    // Initialize sales from localStorage
    loadSales() {
        this.data = JSON.parse(localStorage.getItem('pos_sales')) || [];
        this.receipts = JSON.parse(localStorage.getItem('pos_receipts')) || [];
        return this.data;
    },

    // Record a new sale
    recordSale(saleData) {
        const newSale = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...saleData
        };
        this.data.push(newSale);
        this.saveSales();
        return newSale;
    },

    // Save a full receipt record
    saveReceipt(receiptData) {
        const receipt = {
            id: Date.now(),
            date: new Date().toISOString(),
            receiptNo: Math.floor(Math.random() * 90000) + 10000,
            ...receiptData
        };
        this.receipts.push(receipt);
        localStorage.setItem('pos_receipts', JSON.stringify(this.receipts));
        return receipt;
    },

    // Get all receipts
    getReceipts() {
        return this.receipts;
    },

    // Get a single receipt by id
    getReceiptById(id) {
        return this.receipts.find(r => r.id === id) || null;
    },

    // Save sales to localStorage
    saveSales() {
        localStorage.setItem('pos_sales', JSON.stringify(this.data));
    },

    // Get all sales
    getAllSales() {
        return this.data;
    },

    // Get sales for a specific month (month is 0-indexed)
    getSalesForMonth(year, month) {
        return this.data.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getFullYear() === year && saleDate.getMonth() === month;
        });
    },

    // Get today's sales
    getTodaySales() {
        const today = new Date().toLocaleDateString();
        return this.data.filter(sale => new Date(sale.date).toLocaleDateString() === today);
    }
};
