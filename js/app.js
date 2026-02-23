// Main application logic
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the app
    await initializeApp();

    // Set up event listeners
    setupEventListeners();

    // Start clock update
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Initial customer list update
    updateCustomerOptions();
});

// Initialize application
async function initializeApp() {
    // Load products
    await Products.loadProducts();

    // Display products
    displayProducts(Products.getAllProducts());

    // Refresh cart display from persisted state
    Cart.updateCartDisplay();

    // Load customers
    Customers.loadCustomers();

    // Load sales
    Sales.loadSales();

    // Initialize Auth
    initAuth();
}

// Display products in grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => Cart.addItem(product);

        const weightLabel = product.weight
            ? `<span class="product-weight-badge">${product.weight}${product.weightUnit || 'g'}</span>`
            : '';

        const photoHtml = product.photo
            ? `<img class="product-card-img" src="${product.photo}" alt="${product.name}">`
            : `<div class="product-card-img-placeholder"><i class="fas fa-image"></i></div>`;

        productCard.innerHTML = `
            ${photoHtml}
            <div class="product-card-body">
                <h3>${product.name}</h3>
                <div class="product-price">LKR ${product.price.toFixed(2)}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <small>Stock: ${product.stock}</small>
                    ${weightLabel}
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value;
        const category = document.getElementById('categoryFilter').value;
        filterProducts(query, category);
    });

    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        const category = e.target.value;
        const query = document.getElementById('searchInput').value;
        filterProducts(query, category);
    });

    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', openPaymentModal);

    // Clear cart button
    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if (confirm('Clear all items from cart?')) {
            Cart.clearCart();
            const discountInput = document.getElementById('discountInput');
            if (discountInput) discountInput.value = '';
            Cart.setDiscount(0);
        }
    });

    // Discount input
    const discountInput = document.getElementById('discountInput');
    if (discountInput) {
        discountInput.addEventListener('input', (e) => {
            Cart.setDiscount(e.target.value);
        });
    }

    // Modal close button
    document.querySelector('.close').addEventListener('click', closePaymentModal);

    // Payment method change
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', togglePaymentMethod);
    });

    // Amount received input
    document.getElementById('amountReceived').addEventListener('input', calculateChange);

    // Complete payment button
    document.getElementById('completePaymentBtn').addEventListener('click', completePayment);

    // Print receipt button
    document.getElementById('printReceiptBtn').addEventListener('click', printReceipt);

    // Product form submission
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);

    // Customer form submission
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmit);

    // Payment method change extra handling
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const customerSelect = document.getElementById('saleCustomer');
            if (e.target.value === 'loan') {
                customerSelect.setAttribute('required', 'required');
            } else {
                customerSelect.removeAttribute('required');
            }
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const paymentModal = document.getElementById('paymentModal');
        const receiptModal = document.getElementById('receiptModal');
        const productModal = document.getElementById('productModal');
        const scannerModal = document.getElementById('scannerModal');

        if (e.target === paymentModal) closePaymentModal();
        if (e.target === receiptModal) closeReceipt();
        if (e.target === productModal) closeProductModal();
        if (e.target === scannerModal) closeScanner();
        if (e.target === document.getElementById('customerModal')) closeCustomerModal();
        if (e.target === document.getElementById('customerDetailsModal')) closeDetailsModal();
        if (e.target === document.getElementById('reportModal')) closeReportModal();
        if (e.target === document.getElementById('receiptRecordsModal')) closeReceiptRecords();
    });

    // Auth Listeners
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('saveSetupBtn').addEventListener('click', handleSetup);

    // Add Enter key listener for login
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Edit customer form submission
    document.getElementById('editCustomerForm').addEventListener('submit', handleEditCustomerSubmit);
}

// Filter products based on search and category
function filterProducts(query, category) {
    let products = Products.getAllProducts();

    // Apply category filter
    if (category !== 'all') {
        products = products.filter(p => p.category === category);
    }

    // Apply search filter
    if (query) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    displayProducts(products);
}

// Category tab switching
function setActiveTab(tabEl, category) {
    // Update active class on all tabs
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');

    // Sync hidden select (keeps existing filter logic working)
    const sel = document.getElementById('categoryFilter');
    if (sel) sel.value = category;

    // Re-filter with current search query
    const query = document.getElementById('searchInput').value;
    filterProducts(query, category);
}

// Update date and time
function updateDateTime() {
    const now = new Date();

    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    document.getElementById('date').textContent = now.toLocaleDateString(undefined, dateOptions);
    document.getElementById('time').textContent = now.toLocaleTimeString();
}

// Payment modal functions
function openPaymentModal() {
    if (Cart.items.length === 0) {
        alert('Cart is empty!');
        return;
    }

    document.getElementById('paymentTotal').textContent = `LKR ${Cart.getTotal().toFixed(2)}`;
    document.getElementById('paymentModal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('amountReceived').value = '';
    document.getElementById('change').textContent = 'LKR 0.00';
}

function togglePaymentMethod() {
    const cashDiv = document.getElementById('cashPayment');
    cashDiv.style.display = this.value === 'cash' ? 'block' : 'none';
}

function calculateChange() {
    const total = Cart.getTotal();
    const received = parseFloat(document.getElementById('amountReceived').value) || 0;
    const change = received - total;

    document.getElementById('change').textContent = `LKR ${change >= 0 ? change.toFixed(2) : '0.00'}`;
}

function completePayment() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (paymentMethod === 'cash') {
        const received = parseFloat(document.getElementById('amountReceived').value);
        const total = Cart.getTotal();

        if (received < total) {
            alert('Insufficient amount received!');
            return;
        }
    }

    const customerId = document.getElementById('saleCustomer').value;
    if (paymentMethod === 'loan' && !customerId) {
        alert('Please select a customer for loan payment!');
        return;
    }

    // Process payment and record loan if applicable
    if (customerId) {
        const total = Cart.getTotal();
        const received = paymentMethod === 'cash' ? (parseFloat(document.getElementById('amountReceived').value) || 0) : (paymentMethod === 'card' ? total : 0);

        if (received < total) {
            const loanAmount = total - received;
            const items = Cart.items.map(i => `${i.product.name} x${i.quantity}`);
            Customers.addLoan(customerId, loanAmount, items);
        }
    }

    // Update stock for all items in cart before clearing it
    Cart.items.forEach(item => {
        Products.updateStock(item.product.id, item.quantity);
    });

    // Refresh products grid display to show updated stock
    displayProducts(Products.getAllProducts());

    // Generate receipt
    const amountPaid = paymentMethod === 'cash' ? (parseFloat(document.getElementById('amountReceived').value) || 0) : (paymentMethod === 'card' ? Cart.getTotal() : 0);
    generateReceipt(paymentMethod, customerId, amountPaid);

    // Record sale in history
    const saleData = {
        items: Cart.items.map(i => ({ name: i.product.name, price: i.product.price, qty: i.quantity })),
        total: Cart.getTotal(),
        discount: Cart.discount,
        paymentMethod: paymentMethod,
        customerId: customerId || null
    };
    Sales.recordSale(saleData);

    // Close payment modal
    closePaymentModal();

    // Open receipt modal
    document.getElementById('receiptModal').style.display = 'block';
}

function generateReceipt(paymentMethod, customerId, amountPaid) {
    const now = new Date();
    const receiptContent = document.getElementById('receiptContent');
    const customer = customerId ? Customers.getCustomerById(customerId) : null;
    const total = Cart.getTotal();
    const subtotal = Cart.getSubtotal();
    const discount = Cart.discount;

    // Save receipt record BEFORE clearing cart
    const receiptRecord = Sales.saveReceipt({
        items: Cart.items.map(i => ({ name: i.product.name, price: i.product.price, qty: i.quantity })),
        subtotal: subtotal,
        discount: discount,
        total: total,
        paymentMethod: paymentMethod,
        amountPaid: paymentMethod === 'cash' ? amountPaid : (paymentMethod === 'card' ? total : 0),
        customerName: customer ? customer.name : null,
        customerId: customerId || null
    });

    let receiptHTML = `
        <div class="receipt-header">
            <h3>IHSAN LUCKY STORE</h3>
            <p>KOLLANDALWA KADIGAWA NIKAWERATIYA</p>
            <div class="receipt-separator">***************************************************</div>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
                <span>Net(Rs) :</span>
                <span>${total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="receipt-separator">***************************************************</div>
            <p style="text-align: left; margin: 10px 0 5px 0; font-weight: bold;">VAT LIABLE PRODUCTS(Inclusive VAT) :</p>
        </div>
        
        <div class="receipt-table-header">
            <span>NO</span>
            <span>UNIT</span>
            <span>QTY</span>
            <span>RATE</span>
            <span>AMOUNT</span>
        </div>

        <div class="receipt-items">
    `;

    Cart.items.forEach((item, index) => {
        const itemTotal = item.product.price * item.quantity;
        receiptHTML += `
            <div class="receipt-item-group">
                <div class="receipt-item-name-row">
                    ${index + 1} ${item.product.name.toUpperCase()}
                </div>
                <div class="receipt-item-data-row">
                    <span></span>
                    <span>PKT</span>
                    <span>${item.quantity}</span>
                    <span>${item.product.price.toFixed(2)}</span>
                    <span>${itemTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        `;
    });

    receiptHTML += `
        </div>
        
        <div class="receipt-summary">
            <div class="receipt-row">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
            </div>
            ${discount > 0 ? `
            <div class="receipt-row">
                <span>Discount:</span>
                <span>- ${discount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
            </div>` : ''}
            <div class="receipt-total-row">
                <span>Total:</span>
                <span>${total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div class="receipt-row">
                <span>Payment:</span>
                <span>${paymentMethod.toUpperCase()}</span>
            </div>
            
            <div class="receipt-row">
                <span>Received:</span>
                <span>${amountPaid.toFixed(2)}</span>
            </div>
            
            <div class="receipt-row">
                <span>Change:</span>
                <span>${Math.max(0, amountPaid - total).toFixed(2)}</span>
            </div>
            
            <div class="receipt-row" style="margin-top: 10px; font-weight: bold;">
                <span>NET TOTAL B/F RETURN</span>
                <span>${total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div class="receipt-footer">
            <div class="receipt-separator">...................................................</div>
            <p>DATE: ${now.toLocaleDateString()} TIME: ${now.toLocaleTimeString()}</p>
            <p>RECEIPT #${receiptRecord.receiptNo}</p>
            ${customer ? `<p>CUSTOMER: ${customer.name.toUpperCase()}</p>` : ''}
            <div class="receipt-separator">...................................................</div>
            <p style="margin-top: 10px;">EXPIRY : .........................................</p>
            <p style="margin-top: 10px; font-weight: bold;">THANK YOU FOR SHOPPING WITH US!</p>
        </div>
    `;

    receiptContent.innerHTML = receiptHTML;


    // Clear cart after payment
    Cart.clearCart();

    // Reset discount
    const discountInput = document.getElementById('discountInput');
    if (discountInput) discountInput.value = '';
    Cart.setDiscount(0);
}

function closeReceipt() {
    document.getElementById('receiptModal').style.display = 'none';
}

function printReceipt() {
    console.log('Attempting to print receipt...');
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    if (!receiptContent) {
        console.error('Receipt content is empty!');
        alert('Error: Receipt content is empty. Please try again.');
        return;
    }
    window.print();
}

// Product Management Functions
let currentPhotoBase64 = '';

function previewProductPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentPhotoBase64 = e.target.result;
        document.getElementById('pPhotoImg').src = currentPhotoBase64;
        document.getElementById('pPhotoPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearProductPhoto() {
    currentPhotoBase64 = '';
    document.getElementById('pPhoto').value = '';
    document.getElementById('pPhotoImg').src = '';
    document.getElementById('pPhotoPreview').style.display = 'none';
}

function openProductModal() {
    document.getElementById('productModal').style.display = 'block';
    renderProductListInModal();
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    resetProductForm();
}

function handleProductSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('pId').value;
    const productData = {
        name: document.getElementById('pName').value,
        price: document.getElementById('pPrice').value,
        category: document.getElementById('pCategory').value,
        stock: document.getElementById('pStock').value,
        barcode: document.getElementById('pBarcode').value,
        photo: currentPhotoBase64,
        weight: document.getElementById('pWeight').value,
        weightUnit: document.getElementById('pWeightUnit').value
    };

    if (productId) {
        // Update mode
        Products.updateProduct(productId, productData);
        alert('Product updated successfully!');
    } else {
        // Add mode
        Products.addProduct(productData);
        alert('Product added successfully!');
    }

    // Refresh display
    displayProducts(Products.getAllProducts());
    renderProductListInModal();

    // Reset form
    resetProductForm();
}

function renderProductListInModal() {
    const list = document.getElementById('modalProductList');
    const products = Products.getAllProducts();
    list.innerHTML = '';

    if (products.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 10px;">No products available.</p>';
        return;
    }

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'customer-item'; // Reusing customer-item styles for consistency
        item.style.padding = '10px';
        item.style.marginBottom = '10px';
        item.innerHTML = `
            <div class="customer-info">
                <h4 style="margin: 0;">${product.name}</h4>
                <p style="margin: 5px 0 0 0; font-size: 13px;">
                    LKR ${product.price.toFixed(2)} | Stock: ${product.stock} | ${product.category} | Barcode: ${product.barcode || 'N/A'}
                    ${product.weight ? `| ${product.weight}${product.weightUnit}` : ''}
                </p>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm" onclick="editProduct(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteProduct(${product.id})" title="Delete" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function editProduct(id) {
    const product = Products.getProductById(id);
    if (!product) return;

    document.getElementById('pId').value = product.id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pCategory').value = product.category;
    document.getElementById('pStock').value = product.stock;
    document.getElementById('pBarcode').value = product.barcode || '';
    document.getElementById('pWeight').value = product.weight || '';
    document.getElementById('pWeightUnit').value = product.weightUnit || 'g';
    // Show existing photo
    if (product.photo) {
        currentPhotoBase64 = product.photo;
        document.getElementById('pPhotoImg').src = product.photo;
        document.getElementById('pPhotoPreview').style.display = 'block';
    } else {
        clearProductPhoto();
    }

    // UI Updates
    document.getElementById('productFormBtn').innerHTML = '<i class="fas fa-save"></i> Update Product';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';

    // Scroll to form
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

function resetProductForm() {
    const form = document.getElementById('productForm');
    form.reset();
    document.getElementById('pId').value = '';
    document.getElementById('productFormBtn').innerHTML = '<i class="fas fa-save"></i> Save Product';
    document.getElementById('cancelEditBtn').style.display = 'none';
    clearProductPhoto();
}

function confirmDeleteProduct(id) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        Products.deleteProduct(id);
        displayProducts(Products.getAllProducts());
        renderProductListInModal();
        alert('Product deleted successfully!');
    }
}

// Customer Management Functions
function openCustomerModal() {
    document.getElementById('customerModal').style.display = 'block';
    renderCustomerList();
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
    document.getElementById('customerForm').reset();
}

function handleCustomerSubmit(e) {
    e.preventDefault();

    const customerData = {
        name: document.getElementById('cName').value,
        phone: document.getElementById('cPhone').value
    };

    Customers.addCustomer(customerData);
    renderCustomerList();
    updateCustomerOptions();
    closeCustomerModal();
    alert('Customer added successfully!');
}

function renderCustomerList() {
    const list = document.getElementById('customerList');
    const customers = Customers.getAllCustomers();
    list.innerHTML = '';

    if (customers.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No customers added yet.</p>';
        return;
    }

    customers.forEach(customer => {
        const item = document.createElement('div');
        item.className = 'customer-item';
        item.innerHTML = `
            <div class="customer-info" onclick="openDetailsModal(${customer.id})">
                <h4>${customer.name}</h4>
                <p><i class="fas fa-phone"></i> ${customer.phone}</p>
            </div>
            <div class="customer-loan">
                <span class="loan-label">Pending Loan</span>
                <span class="loan-amount">LKR ${customer.loan.toFixed(2)}</span>
                <button class="btn btn-secondary pay-loan-btn" onclick="openDetailsModal(${customer.id})" style="margin-top: 5px;">View Details</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateCustomerOptions() {
    const select = document.getElementById('saleCustomer');
    const customers = Customers.getAllCustomers();

    // Reset but keep first option
    select.innerHTML = '<option value="">Guest Customer</option>';

    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.phone}) - Loan: LKR ${customer.loan.toFixed(2)}`;
        if (customer.loan > 0) option.className = 'has-debt';
        select.appendChild(option);
    });
}

// Customer Details and Editing Functions
let currentViewedCustomerId = null;

function openDetailsModal(id) {
    currentViewedCustomerId = id;
    const customer = Customers.getCustomerById(id);
    if (!customer) return;

    // Set basic info
    const infoDiv = document.getElementById('customerBasicInfo');
    infoDiv.innerHTML = `
        <h3>${customer.name}</h3>
        <p><i class="fas fa-phone"></i> ${customer.phone}</p>
        <p><i class="fas fa-id-badge"></i> ID: ${customer.id}</p>
    `;

    // Set loan status
    const statusDiv = document.getElementById('customerLoanStatus');
    statusDiv.innerHTML = `
        <span class="loan-label">Total Outstanding</span>
        <span class="loan-amount" style="font-size: 24px;">LKR ${customer.loan.toFixed(2)}</span>
    `;

    // Render history
    renderCustomerHistory(customer.history);

    // Reset visibility
    toggleEditCustomer(false);
    hidePaymentForm();

    document.getElementById('customerDetailsModal').style.display = 'block';
}

function closeDetailsModal() {
    document.getElementById('customerDetailsModal').style.display = 'none';
    currentViewedCustomerId = null;
}

function toggleEditCustomer(show) {
    const editSection = document.getElementById('editCustomerSection');
    if (show) {
        const customer = Customers.getCustomerById(currentViewedCustomerId);
        document.getElementById('editCustomerId').value = customer.id;
        document.getElementById('editCName').value = customer.name;
        document.getElementById('editCPhone').value = customer.phone;
        editSection.style.display = 'block';
    } else {
        editSection.style.display = 'none';
    }
}

function handleEditCustomerSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editCustomerId').value;
    const data = {
        name: document.getElementById('editCName').value,
        phone: document.getElementById('editCPhone').value
    };

    Customers.updateCustomer(id, data);
    openDetailsModal(id); // Refresh view
    renderCustomerList(); // Refresh list
    updateCustomerOptions(); // Refresh checkout options
    alert('Customer updated successfully!');
}

function renderCustomerHistory(history) {
    const list = document.getElementById('customerHistoryList');
    list.innerHTML = '';

    if (!history || history.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No transaction history.</p>';
        return;
    }

    // Show newest first
    [...history].reverse().forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <span class="history-type type-${item.type}">${item.type}</span>
                <span class="history-date">${new Date(item.date).toLocaleDateString()} ${new Date(item.date).toLocaleTimeString()}</span>
                ${item.items ? `<div style="font-size: 12px; margin-top: 5px; color: var(--text-muted);">${item.items.join(', ')}</div>` : ''}
            </div>
            <div class="history-amount">${item.type === 'loan' ? '+' : '-'} LKR ${item.amount.toFixed(2)}</div>
        `;
        list.appendChild(historyItem);
    });
}

function showPaymentForm() {
    document.getElementById('paymentFormSection').style.display = 'block';
    document.getElementById('paymentAmount').focus();
}

function hidePaymentForm() {
    document.getElementById('paymentFormSection').style.display = 'none';
    document.getElementById('paymentAmount').value = '';
}

function submitLoanPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    Customers.recordPayment(currentViewedCustomerId, amount);

    // Refresh
    openDetailsModal(currentViewedCustomerId);
    renderCustomerList();
    updateCustomerOptions();

    alert('Payment recorded successfully!');

    if (confirm('Do you want to print a payment receipt?')) {
        printPaymentReceipt(currentViewedCustomerId, amount);
    }
}

function printPaymentReceipt(customerId, amount) {
    const customer = Customers.getCustomerById(customerId);
    const now = new Date();
    const receiptContent = document.getElementById('receiptContent');

    let receiptHTML = `
        <div class="receipt-header">
            <h3>IHSAN LUCKY STORE</h3>
            <p>LOAN PAYMENT RECEIPT</p>
            <p>${now.toLocaleString()}</p>
        </div>
        <div class="receipt-items" style="border-top: 1px dashed #000; padding-top: 10px;">
            <div class="receipt-item">
                <span>Customer:</span>
                <span>${customer.name}</span>
            </div>
            <div class="receipt-item">
                <span>Amount Paid:</span>
                <span>LKR ${amount.toFixed(2)}</span>
            </div>
            <div class="receipt-item">
                <span>Remaining Balance:</span>
                <span>LKR ${customer.loan.toFixed(2)}</span>
            </div>
        </div>
        <p style="text-align: center; margin-top: 20px;">Thank you for your payment!</p>
    `;

    receiptContent.innerHTML = receiptHTML;
    document.getElementById('receiptModal').style.display = 'block';

    // Tiny delay to ensure modal is visible if browser blocks print otherwise
    setTimeout(() => {
        window.print();
    }, 500);
}

// Auth Integration Functions
function initAuth() {
    if (!Auth.hasPassword()) {
        // First time run
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('setupModal').style.display = 'block';
    } else {
        // Regular run
        if (Auth.checkSession()) {
            document.getElementById('loginOverlay').style.display = 'none';
        } else {
            document.getElementById('loginOverlay').style.display = 'flex';
        }
    }
}

function handleLogin() {
    const password = document.getElementById('loginPassword').value;
    if (Auth.login(password)) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginPassword').value = '';
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

function handleSetup() {
    const p1 = document.getElementById('setupPassword').value;
    const p2 = document.getElementById('confirmSetupPassword').value;

    if (p1 !== p2) {
        alert("Passwords do not match!");
        return;
    }

    const result = Auth.setPassword(p1);
    if (result.success) {
        alert("Admin password set successfully!");
        document.getElementById('setupModal').style.display = 'none';
        Auth.login(p1); // Log them in automatically
        document.getElementById('loginOverlay').style.display = 'none';
    } else {
        alert(result.message);
    }
}

function handlePasswordChange() {
    const p1 = document.getElementById('newAdminPass').value;
    const p2 = document.getElementById('confirmNewAdminPass').value;

    if (p1 === '' || p1 !== p2) {
        alert("Passwords do not match or are empty!");
        return;
    }

    const result = Auth.setPassword(p1);
    if (result.success) {
        alert("Password changed successfully!");
        document.getElementById('newAdminPass').value = '';
        document.getElementById('confirmNewAdminPass').value = '';
    } else {
        alert(result.message);
    }
}

function logout() {
    Auth.logout();
    location.reload(); // Quickest way to reset state and show login
}

// Reporting Functions
let currentReportType = 'sales';

function openReportModal() {
    document.getElementById('reportModal').style.display = 'block';
    showReport('sales');
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function showReport(type) {
    currentReportType = type;
    const display = document.getElementById('reportDisplayArea');
    display.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating report...';

    // Highlight active tab
    const tabs = document.querySelectorAll('.report-tabs .btn');
    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase().includes(type)) {
            tab.classList.add('btn-primary');
            tab.classList.remove('btn-secondary');
        } else {
            tab.classList.add('btn-secondary');
            tab.classList.remove('btn-primary');
        }
    });

    let html = '';
    if (type === 'sales') {
        const now = new Date();
        const monthlySales = Sales.getSalesForMonth(now.getFullYear(), now.getMonth());
        const total = monthlySales.reduce((sum, s) => sum + s.total, 0);
        const count = monthlySales.length;

        html = `
            <h3>Monthly Sales Report - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <div style="margin-top: 20px;">
                <p>Total Revenue: <strong>LKR ${total.toFixed(2)}</strong></p>
                <p>Total Transactions: <strong>${count}</strong></p>
                <p>Today's Sales: <strong>LKR ${Sales.getTodaySales().reduce((sum, s) => sum + s.total, 0).toFixed(2)}</strong></p>
            </div>
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                        <th style="padding: 10px;">Date</th>
                        <th style="padding: 10px;">Total</th>
                        <th style="padding: 10px;">Method</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthlySales.slice(-10).reverse().map(s => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 10px;">${new Date(s.date).toLocaleDateString()}</td>
                            <td style="padding: 10px;">LKR ${s.total.toFixed(2)}</td>
                            <td style="padding: 10px; text-transform: uppercase;">${s.paymentMethod}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 15px;">Showing last 10 transactions of the month.</p>
        `;
    } else if (type === 'credit') {
        const customers = Customers.getAllCustomers();
        const totalCredit = customers.reduce((sum, c) => sum + c.loan, 0);
        const customersInDebt = customers.filter(c => c.loan > 0);

        html = `
            <h3>Total Outstanding Credit Report</h3>
            <div style="margin-top: 20px;">
                <p>Total Debt: <strong style="color: var(--danger-color);">LKR ${totalCredit.toFixed(2)}</strong></p>
                <p>Customers with Debt: <strong>${customersInDebt.length} / ${customers.length}</strong></p>
            </div>
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                        <th style="padding: 10px;">Customer</th>
                        <th style="padding: 10px;">Phone</th>
                        <th style="padding: 10px;">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${customersInDebt.sort((a, b) => b.loan - a.loan).map(c => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 10px;">${c.name}</td>
                            <td style="padding: 10px;">${c.phone}</td>
                            <td style="padding: 10px; color: var(--danger-color);">LKR ${c.loan.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (type === 'stock') {
        const products = Products.getAllProducts();

        html = `
            <h3>Inventory Stock Report</h3>
            <div style="margin-top: 10px;">
                <p>Total Items: <strong>${products.length}</strong></p>
            </div>
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                        <th style="padding: 10px;">Product</th>
                        <th style="padding: 10px;">Category</th>
                        <th style="padding: 10px;">Stock</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.sort((a, b) => a.stock - b.stock).map(p => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 10px;">${p.name}</td>
                            <td style="padding: 10px; text-transform: capitalize;">${p.category}</td>
                            <td style="padding: 10px; ${p.stock < 10 ? 'color: var(--danger-color); font-weight: bold;' : ''}">${p.stock}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (type === 'security') {
        html = `
            <h3>Admin Security Settings</h3>
            <div style="margin-top: 20px;" class="glass-form">
                <p>Change your administrative password below. This password protects Reports, Stocks, and Customer data.</p>
                <div class="form-group" style="margin-top: 15px;">
                    <label for="newAdminPass">New Password</label>
                    <input type="password" id="newAdminPass" placeholder="Leave empty to keep current">
                </div>
                <div class="form-group">
                    <label for="confirmNewAdminPass">Confirm New Password</label>
                    <input type="password" id="confirmNewAdminPass">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="handlePasswordChange()">Update Password</button>
                    <button class="btn btn-secondary" onclick="logout()">Logout Admin</button>
                </div>
            </div>
        `;
    }

    display.innerHTML = html;
}

function printCurrentReport() {
    const display = document.getElementById('reportDisplayArea').innerHTML;
    const now = new Date();

    let reportTitle = "IHSAN LUCKY STORE - REPORT";
    if (currentReportType === 'sales') reportTitle = "MONTHLY SALES REPORT";
    if (currentReportType === 'credit') reportTitle = "CREDIT CUSTOMERS REPORT";
    if (currentReportType === 'stock') reportTitle = "STOCK INVENTORY REPORT";

    const receiptContent = document.getElementById('receiptContent');
    receiptContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>IHSAN LUCKY STORE</h3>
            <h4>${reportTitle}</h4>
            <p>${now.toLocaleString()}</p>
        </div>
        <div class="report-print-content" style="font-family: Arial, sans-serif; color: #000;">
            ${display}
        </div>
    `;

    document.getElementById('receiptModal').style.display = 'block';

    setTimeout(() => {
        window.print();
    }, 500);
}

let html5QrCode = null;

function openScanner() {
    document.getElementById('scannerModal').style.display = 'block';
    document.getElementById('scannerStatus').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing camera...';

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Try starting with environment camera (back camera)
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
        .then(() => {
            document.getElementById('scannerStatus').textContent = 'Scanning... Center the QR code in the box.';
        })
        .catch(err => {
            console.warn("Environment camera not found, trying default camera...", err);
            // Fallback: try any available camera
            html5QrCode.start({ facingMode: "user" }, config, onScanSuccess)
                .then(() => {
                    document.getElementById('scannerStatus').textContent = 'Scanning (Front/Default Camera)...';
                })
                .catch(fallbackErr => {
                    console.error("Scanner Error:", fallbackErr);
                    let errorMsg = "Camera error: ";
                    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                        errorMsg += "Scanner requires HTTPS (Secure Connection).";
                    } else if (fallbackErr.name === 'NotAllowedError' || fallbackErr.message.includes('permission')) {
                        errorMsg += "Permission denied. Please allow camera access.";
                    } else if (fallbackErr.name === 'NotFoundError') {
                        errorMsg += "No camera found on this device.";
                    } else {
                        errorMsg += fallbackErr.message || fallbackErr;
                    }
                    document.getElementById('scannerStatus').innerHTML = `<span style="color: #ef4444;">${errorMsg}</span>`;
                });
        });
}

function closeScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
            document.getElementById('scannerModal').style.display = 'none';
        }).catch(err => {
            console.error(err);
            document.getElementById('scannerModal').style.display = 'none';
        });
    } else {
        document.getElementById('scannerModal').style.display = 'none';
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Stop scanner on success
    closeScanner();

    // Process scanned text
    // Try barcode first
    let product = Products.getProductByBarcode(decodedText);

    // If not found by barcode, try parsing as ID (for backward compatibility with old QR codes)
    if (!product) {
        const productId = parseInt(decodedText);
        if (!isNaN(productId)) {
            product = Products.getProductById(productId);
        }
    }

    if (product) {
        Cart.addItem(product);
        // Visual feedback
        const btn = document.getElementById('scanQrBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Added!';
        btn.classList.add('btn-success');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
        }, 2000);
    } else {
        alert('Product not found: ' + decodedText);
    }
}

// =============================================
// Receipt Records Functions
// =============================================

function openReceiptRecords() {
    document.getElementById('receiptRecordsModal').style.display = 'block';
    renderReceiptRecords('');
}

function closeReceiptRecords() {
    document.getElementById('receiptRecordsModal').style.display = 'none';
}

function renderReceiptRecords(searchQuery) {
    const list = document.getElementById('receiptRecordsList');
    let receipts = [...Sales.getReceipts()].reverse(); // newest first

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        receipts = receipts.filter(r =>
            String(r.receiptNo).includes(q) ||
            (r.customerName && r.customerName.toLowerCase().includes(q)) ||
            r.paymentMethod.toLowerCase().includes(q)
        );
    }

    if (receipts.length === 0) {
        list.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:30px;">No receipt records found.</p>`;
        return;
    }

    list.innerHTML = receipts.map(r => {
        const date = new Date(r.date);
        const methodIcon = r.paymentMethod === 'cash' ? 'fa-money-bill-wave' :
            r.paymentMethod === 'card' ? 'fa-credit-card' : 'fa-handshake';
        const methodColor = r.paymentMethod === 'cash' ? '#22c55e' :
            r.paymentMethod === 'card' ? '#3b82f6' : '#f59e0b';
        return `
        <div class="receipt-record-item" onclick="viewReceiptDetail(${r.id})">
            <div class="rr-left">
                <div class="rr-no"><i class="fas fa-receipt"></i> #${r.receiptNo}</div>
                <div class="rr-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
                ${r.customerName ? `<div class="rr-customer"><i class="fas fa-user"></i> ${r.customerName}</div>` : '<div class="rr-customer" style="color:var(--text-muted);">Guest</div>'}
            </div>
            <div class="rr-right">
                <div class="rr-total">LKR ${r.total.toFixed(2)}</div>
                <div class="rr-method" style="color:${methodColor};"><i class="fas ${methodIcon}"></i> ${r.paymentMethod.toUpperCase()}</div>
                <div class="rr-view-btn"><i class="fas fa-eye"></i> View</div>
            </div>
        </div>`;
    }).join('');
}

function viewReceiptDetail(receiptId) {
    const r = Sales.getReceiptById(receiptId);
    if (!r) return;

    const date = new Date(r.date);
    const receiptContent = document.getElementById('receiptContent');

    let itemsHTML = r.items.map(item => `
        <div class="receipt-item">
            <span>${item.name} x${item.qty}</span>
            <span>LKR ${(item.price * item.qty).toFixed(2)}</span>
        </div>`).join('');

    let balanceColor = r.paymentMethod === 'loan' ? '#ef4444' : '#22c55e';
    let amountPaidDisplay = r.amountPaid > 0 ? `LKR ${r.amountPaid.toFixed(2)}` : 'LKR 0.00';

    receiptContent.innerHTML = `
        <div class="receipt-header">
            <h3>IHSAN LUCKY STORE</h3>
            ${r.customerName ? `<p>Customer: ${r.customerName}</p>` : ''}
            <p>${date.toLocaleString()}</p>
            <p>Receipt #${r.receiptNo}</p>
        </div>
        <div class="receipt-items">${itemsHTML}</div>
        <div class="receipt-item"><span>Subtotal:</span><span>LKR ${r.subtotal.toFixed(2)}</span></div>
        ${r.discount > 0 ? `<div class="receipt-item"><span>Discount:</span><span>- LKR ${r.discount.toFixed(2)}</span></div>` : ''}
        <div class="receipt-item receipt-total"><span>Total:</span><span>LKR ${r.total.toFixed(2)}</span></div>
        <div class="receipt-item"><span>Payment Method:</span><span>${r.paymentMethod.toUpperCase()}</span></div>
        <div class="receipt-item"><span>Amount Paid:</span><span>${amountPaidDisplay}</span></div>
        <div class="receipt-item" style="color:${balanceColor};font-weight:bold;">
            <span>${r.balanceLabel}:</span>
            <span>LKR ${r.balanceAmount.toFixed(2)}</span>
        </div>
        <p style="text-align:center;margin-top:20px;">Thank you for shopping with us!</p>
    `;

    // Close records modal, open receipt modal for viewing/printing
    closeReceiptRecords();
    document.getElementById('receiptModal').style.display = 'block';
}

// =============================================
// SETTINGS — Theme & Appearance
// =============================================

const THEMES = {
    green: {
        label: 'Forest Green',
        primary: '#4CAF50',
        primaryDark: '#388E3C',
        primaryLight: '#E8F5E9',
        accent: '#43A047',
        swatch: '#4CAF50'
    },
    blue: {
        label: 'Ocean Blue',
        primary: '#2196F3',
        primaryDark: '#1565C0',
        primaryLight: '#E3F2FD',
        accent: '#1E88E5',
        swatch: '#2196F3'
    },
    purple: {
        label: 'Royal Purple',
        primary: '#7C3AED',
        primaryDark: '#5B21B6',
        primaryLight: '#EDE9FE',
        accent: '#6D28D9',
        swatch: '#7C3AED'
    },
    orange: {
        label: 'Sunset Orange',
        primary: '#F97316',
        primaryDark: '#C2410C',
        primaryLight: '#FFF7ED',
        accent: '#EA7000',
        swatch: '#F97316'
    },
    red: {
        label: 'Crimson Red',
        primary: '#EF4444',
        primaryDark: '#B91C1C',
        primaryLight: '#FEF2F2',
        accent: '#DC2626',
        swatch: '#EF4444'
    },
    teal: {
        label: 'Deep Teal',
        primary: '#0D9488',
        primaryDark: '#0F766E',
        primaryLight: '#F0FDFA',
        accent: '#14B8A6',
        swatch: '#0D9488'
    },
    pink: {
        label: 'Rose Pink',
        primary: '#EC4899',
        primaryDark: '#BE185D',
        primaryLight: '#FDF2F8',
        accent: '#DB2777',
        swatch: '#EC4899'
    },
    slate: {
        label: 'Slate Dark',
        primary: '#475569',
        primaryDark: '#1E293B',
        primaryLight: '#F1F5F9',
        accent: '#334155',
        swatch: '#475569'
    }
};

function applyTheme(themeKey) {
    const theme = THEMES[themeKey];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-dark', theme.primaryDark);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--accent', theme.accent);

    // Persist
    localStorage.setItem('pos_theme', themeKey);

    // Update swatch active state
    document.querySelectorAll('.theme-swatch-btn').forEach(btn => {
        btn.style.outline = btn.dataset.theme === themeKey
            ? `3px solid ${theme.primary}`
            : '3px solid transparent';
        btn.style.outlineOffset = '2px';
    });
}

function renderThemeSwatches() {
    const container = document.getElementById('themeSwatches');
    if (!container) return;

    const savedTheme = localStorage.getItem('pos_theme') || 'green';
    container.innerHTML = '';

    Object.entries(THEMES).forEach(([key, theme]) => {
        const btn = document.createElement('button');
        btn.className = 'theme-swatch-btn';
        btn.dataset.theme = key;
        btn.title = theme.label;
        btn.style.cssText = `
            width: 100%;
            aspect-ratio: 1;
            border-radius: 12px;
            background: ${theme.swatch};
            border: none;
            cursor: pointer;
            transition: transform 0.15s, outline 0.15s;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 6px;
            outline: 3px solid ${key === savedTheme ? theme.swatch : 'transparent'};
            outline-offset: 2px;
        `;
        btn.innerHTML = `
            <span style="font-size: 20px; color: white; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                ${key === savedTheme ? '<i class="fas fa-check"></i>' : ''}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.4); text-align:center; line-height: 1.2;">${theme.label}</span>
        `;
        btn.onmouseover = () => btn.style.transform = 'scale(1.08)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        btn.onclick = () => {
            applyTheme(key);
            // Refresh check marks
            renderThemeSwatches();
        };
        container.appendChild(btn);
    });
}

function setFontSize(size) {
    const sizes = { small: '13px', normal: '15px', large: '17px' };
    document.documentElement.style.fontSize = sizes[size] || '15px';
    localStorage.setItem('pos_font_size', size);
}

function loadSavedSettings() {
    const savedTheme = localStorage.getItem('pos_theme') || 'green';
    applyTheme(savedTheme);

    const savedFont = localStorage.getItem('pos_font_size') || 'normal';
    setFontSize(savedFont);
}

function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
    renderThemeSwatches();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Load settings on startup — called from initializeApp
document.addEventListener('DOMContentLoaded', loadSavedSettings);
