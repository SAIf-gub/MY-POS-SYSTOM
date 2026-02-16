// Customer data management
const Customers = {
    data: [],

    // Initialize customers from localStorage
    loadCustomers() {
        const savedCustomers = JSON.parse(localStorage.getItem('pos_customers')) || [];
        this.data = savedCustomers;
        return this.data;
    },

    // Add new customer
    addCustomer(customerData) {
        const newId = this.data.length > 0 ? Math.max(...this.data.map(c => c.id)) + 1 : 1;
        const newCustomer = {
            id: newId,
            name: customerData.name,
            phone: customerData.phone,
            loan: 0,
            history: []
        };
        this.data.push(newCustomer);
        this.saveCustomers();
        return newCustomer;
    },

    // Save customers to localStorage
    saveCustomers() {
        localStorage.setItem('pos_customers', JSON.stringify(this.data));
    },

    // Get all customers
    getAllCustomers() {
        return this.data;
    },

    // Get customer by ID
    getCustomerById(id) {
        return this.data.find(c => c.id === parseInt(id));
    },

    // Record a loan
    addLoan(customerId, amount, items) {
        const customer = this.getCustomerById(customerId);
        if (customer) {
            customer.loan += amount;
            customer.history.push({
                date: new Date().toISOString(),
                type: 'loan',
                amount: amount,
                items: items
            });
            this.saveCustomers();
        }
    },

    // Record a payment
    recordPayment(customerId, amount) {
        const customer = this.getCustomerById(customerId);
        if (customer) {
            customer.loan -= amount;
            customer.history.push({
                date: new Date().toISOString(),
                type: 'payment',
                amount: amount
            });
            this.saveCustomers();
        }
    },

    // Delete customer
    deleteCustomer(id) {
        this.data = this.data.filter(c => c.id !== parseInt(id));
        this.saveCustomers();
    },

    // Update customer details
    updateCustomer(id, customerData) {
        const customer = this.getCustomerById(id);
        if (customer) {
            customer.name = customerData.name || customer.name;
            customer.phone = customerData.phone || customer.phone;
            this.saveCustomers();
            return customer;
        }
        return null;
    }
};
