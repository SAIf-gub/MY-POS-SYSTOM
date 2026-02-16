// Products data management
const Products = {
    data: null,

    // Load products from JSON
    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            this.data = await response.json();
            return this.data.products;
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback data in case JSON fails to load
            this.data = {
                products: [
                    { id: 1, name: "Fresh Tomatoes", price: 2.99, category: "vegetables", stock: 50 },
                    { id: 2, name: "Organic Apples", price: 3.49, category: "fruits", stock: 40 },
                    { id: 3, name: "Whole Milk", price: 3.99, category: "dairy", stock: 30 },
                    { id: 4, name: "Fresh Bread", price: 2.49, category: "bakery", stock: 20 },
                    { id: 5, name: "Orange Juice", price: 4.99, category: "beverages", stock: 25 },
                    { id: 6, name: "Potato Chips", price: 2.99, category: "snacks", stock: 60 }
                ]
            };
            return this.data.products;
        }
    },

    // Get all products
    getAllProducts() {
        return this.data ? this.data.products : [];
    },

    // Get product by ID
    getProductById(id) {
        return this.data.products.find(p => p.id === parseInt(id));
    },

    // Filter products by category
    getProductsByCategory(category) {
        if (category === 'all') return this.getAllProducts();
        return this.data.products.filter(p => p.category === category);
    },

    // Search products
    searchProducts(query) {
        query = query.toLowerCase();
        return this.data.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }
};
// Shopping cart management
const Cart = {
    items: [],

    // Add item to cart
    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                product: product,
                quantity: quantity
            });
        }

        this.updateCartDisplay();
    },

    // Remove item from cart
    removeItem(productId) {
        this.items = this.items.filter(item => item.product.id !== productId);
        this.updateCartDisplay();
    },

    // Update quantity
    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.product.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQuantity;
            }
        }
        this.updateCartDisplay();
    },

    // Clear cart
    clearCart() {
        this.items = [];
        this.updateCartDisplay();
    },

    // Calculate subtotal
    getSubtotal() {
        return this.items.reduce((sum, item) =>
            sum + (item.product.price * item.quantity), 0
        );
    },

    // Calculate tax (10%)
    getTax() {
        return this.getSubtotal() * 0.10;
    },

    // Calculate total
    getTotal() {
        return this.getSubtotal() + this.getTax();
    },

    // Update cart display
    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const subtotalEl = document.getElementById('subtotal');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        // Clear cart display
        cartItems.innerHTML = '';

        // Add each item to display
        this.items.forEach(item => {
            const itemTotal = item.product.price * item.quantity;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.name}</div>
                    <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="Cart.updateQuantity(${item.product.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="Cart.updateQuantity(${item.product.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                <i class="fas fa-trash remove-item" onclick="Cart.removeItem(${item.product.id})"></i>
            `;
            cartItems.appendChild(itemDiv);
        });

        // Update totals
        subtotalEl.textContent = `$${this.getSubtotal().toFixed(2)}`;
        taxEl.textContent = `$${this.getTax().toFixed(2)}`;
        totalEl.textContent = `$${this.getTotal().toFixed(2)}`;
    }
};// Main application logic
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the app
    await initializeApp();

    // Set up event listeners
    setupEventListeners();

    // Start clock update
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Initialize application
async function initializeApp() {
    // Load products
    await Products.loadProducts();

    // Display products
    displayProducts(Products.getAllProducts());
}

// Display products in grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => Cart.addItem(product);
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <small>Stock: ${product.stock}</small>
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
        }
    });

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

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('paymentModal');
        if (e.target === modal) {
            closePaymentModal();
        }
    });
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

    document.getElementById('paymentTotal').textContent = `$${Cart.getTotal().toFixed(2)}`;
    document.getElementById('paymentModal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('amountReceived').value = '';
    document.getElementById('change').textContent = '$0.00';
}

function togglePaymentMethod() {
    const cashDiv = document.getElementById('cashPayment');
    cashDiv.style.display = this.value === 'cash' ? 'block' : 'none';
}

function calculateChange() {
    const total = Cart.getTotal();
    const received = parseFloat(document.getElementById('amountReceived').value) || 0;
    const change = received - total;

    document.getElementById('change').textContent = `$${change >= 0 ? change.toFixed(2) : '0.00'}`;
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

    // Generate receipt
    generateReceipt(paymentMethod);

    // Close payment modal
    closePaymentModal();

    // Open receipt modal
    document.getElementById('receiptModal').style.display = 'block';
}

function generateReceipt(paymentMethod) {
    const now = new Date();
    const receiptContent = document.getElementById('receiptContent');

    let receiptHTML = `
        <div class="receipt-header">
            <h3>Supermarket POS</h3>
            <p>${now.toLocaleString()}</p>
            <p>Receipt #${Math.floor(Math.random() * 10000)}</p>
        </div>
        <div class="receipt-items">
    `;

    Cart.items.forEach(item => {
        receiptHTML += `
            <div class="receipt-item">
                <span>${item.product.name} x${item.quantity}</span>
                <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });

    receiptHTML += `
        </div>
        <div class="receipt-item">
            <span>Subtotal:</span>
            <span>$${Cart.getSubtotal().toFixed(2)}</span>
        </div>
        <div class="receipt-item">
            <span>Tax (10%):</span>
            <span>$${Cart.getTax().toFixed(2)}</span>
        </div>
        <div class="receipt-item receipt-total">
            <span>Total:</span>
            <span>$${Cart.getTotal().toFixed(2)}</span>
        </div>
        <div class="receipt-item">
            <span>Payment Method:</span>
            <span>${paymentMethod.toUpperCase()}</span>
        </div>
        <p style="text-align: center; margin-top: 20px;">Thank you for shopping with us!</p>
    `;

    receiptContent.innerHTML = receiptHTML;

    // Clear cart after payment
    Cart.clearCart();
}

function closeReceipt() {
    document.getElementById('receiptModal').style.display = 'none';
}