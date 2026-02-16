// Shopping cart management
const Cart = {
    items: JSON.parse(localStorage.getItem('pos_cart')) || [],
    discount: 0,

    // Add item to cart
    addItem(product, quantity = 1) {
        if (product.stock < quantity) {
            alert('Not enough stock!');
            return;
        }

        const existingItem = this.items.find(item => item.product.id === product.id);

        if (existingItem) {
            if (product.stock < existingItem.quantity + quantity) {
                alert('Not enough stock!');
                return;
            }
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                product: product,
                quantity: quantity
            });
        }

        this.saveCart();
        this.updateCartDisplay();
    },

    // Remove item from cart
    removeItem(productId) {
        this.items = this.items.filter(item => item.product.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    },

    // Update quantity
    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.product.id === productId);
        const product = Products.getProductById(productId);

        if (item && product) {
            if (newQuantity > product.stock) {
                alert('Not enough stock!');
                return;
            }

            if (newQuantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQuantity;
            }
        }
        this.saveCart();
        this.updateCartDisplay();
    },

    // Clear cart
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
    },

    saveCart() {
        localStorage.setItem('pos_cart', JSON.stringify(this.items));
    },

    // Calculate subtotal
    getSubtotal() {
        return this.items.reduce((sum, item) =>
            sum + (item.product.price * item.quantity), 0
        );
    },

    // Set discount
    setDiscount(amount) {
        this.discount = parseFloat(amount) || 0;
        this.updateCartDisplay();
    },

    // Calculate total
    getTotal() {
        return Math.max(0, this.getSubtotal() - this.discount);
    },

    // Update cart display
    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const subtotalEl = document.getElementById('subtotal');
        const discountEl = document.getElementById('discountAmount');
        const totalEl = document.getElementById('total');

        if (!cartItems) return;

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
                    <div class="cart-item-price">LKR ${item.product.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="Cart.updateQuantity(${item.product.id}, ${item.quantity - 1})"><i class="fas fa-minus"></i></button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="Cart.updateQuantity(${item.product.id}, ${item.quantity + 1})"><i class="fas fa-plus"></i></button>
                </div>
                <div class="cart-item-total">LKR ${itemTotal.toFixed(2)}</div>
                <i class="fas fa-trash remove-item" onclick="Cart.removeItem(${item.product.id})"></i>
            `;
            cartItems.appendChild(itemDiv);
        });

        // Update totals
        subtotalEl.textContent = `LKR ${this.getSubtotal().toFixed(2)}`;
        if (discountEl) discountEl.textContent = `LKR ${this.discount.toFixed(2)}`;
        totalEl.textContent = `LKR ${this.getTotal().toFixed(2)}`;
    }
};
