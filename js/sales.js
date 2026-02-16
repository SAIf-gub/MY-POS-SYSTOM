// Sales data management
const Sales = {
    data: [],

    // Initialize sales from localStorage
    loadSales() {
        this.data = JSON.parse(localStorage.getItem('pos_sales')) || [];
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
