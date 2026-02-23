// Products data management
const Products = {
    data: null,

    // Load products from JSON
    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            const data = await response.json();

            // Load stock from localStorage or use JSON data
            const savedStock = JSON.parse(localStorage.getItem('pos_stock')) || {};
            // Load custom products
            const customProducts = JSON.parse(localStorage.getItem('pos_custom_products')) || [];

            const allProducts = [...data.products, ...customProducts];

            this.data = {
                products: allProducts.map(p => ({
                    ...p,
                    stock: savedStock[p.id] !== undefined ? savedStock[p.id] : p.stock,
                    barcode: p.barcode || '',
                    photo: p.photo || '',
                    weight: p.weight || '',
                    weightUnit: p.weightUnit || 'g'
                }))
            };
            return this.data.products;
        } catch (error) {
            console.error('Error loading products:', error);
            // Fallback data
            const fallback = [
                { id: 1, name: "Fresh Tomatoes", price: 2.99, category: "vegetables", stock: 50 },
                { id: 2, name: "Organic Apples", price: 3.49, category: "fruits", stock: 40 },
                { id: 3, name: "Whole Milk", price: 3.99, category: "dairy", stock: 30 },
                { id: 4, name: "Fresh Bread", price: 2.49, category: "bakery", stock: 20 },
                { id: 5, name: "Orange Juice", price: 4.99, category: "beverages", stock: 25 },
                { id: 6, name: "Potato Chips", price: 2.99, category: "snacks", stock: 60 },
                { id: 7, name: "Sugar", price: 250.00, category: "beverages", stock: 250 },
            ];

            const savedStock = JSON.parse(localStorage.getItem('pos_stock')) || {};
            const customProducts = JSON.parse(localStorage.getItem('pos_custom_products')) || [];

            const allProducts = [...fallback, ...customProducts];

            this.data = {
                products: allProducts.map(p => ({
                    ...p,
                    stock: savedStock[p.id] !== undefined ? savedStock[p.id] : p.stock,
                    barcode: p.barcode || '',
                    photo: p.photo || '',
                    weight: p.weight || '',
                    weightUnit: p.weightUnit || 'g'
                }))
            };
            return this.data.products;
        }
    },

    // Add new product
    addProduct(productData) {
        const customProducts = JSON.parse(localStorage.getItem('pos_custom_products')) || [];

        // Generate new ID (max ID + 1)
        const allIds = this.data.products.map(p => p.id);
        const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;

        const newProduct = {
            id: newId,
            ...productData,
            price: parseFloat(productData.price),
            stock: parseInt(productData.stock),
            barcode: productData.barcode || '',
            photo: productData.photo || '',
            weight: productData.weight || '',
            weightUnit: productData.weightUnit || 'g'
        };

        // Add to in-memory data
        this.data.products.push(newProduct);

        // Save to custom products in localStorage
        customProducts.push(newProduct);
        localStorage.setItem('pos_custom_products', JSON.stringify(customProducts));

        // Save initial stock
        this.saveStock();

        return newProduct;
    },

    // Update existing product
    updateProduct(productId, updatedData) {
        const product = this.getProductById(productId);
        if (product) {
            // Update in-memory data
            product.name = updatedData.name;
            product.price = parseFloat(updatedData.price);
            product.category = updatedData.category;
            product.stock = parseInt(updatedData.stock);
            product.barcode = updatedData.barcode || product.barcode || '';
            if (updatedData.photo) product.photo = updatedData.photo;
            product.weight = updatedData.weight || '';
            product.weightUnit = updatedData.weightUnit || 'g';

            // Update custom products in localStorage if it was a custom product
            const customProducts = JSON.parse(localStorage.getItem('pos_custom_products')) || [];
            const customIdx = customProducts.findIndex(p => p.id === parseInt(productId));

            if (customIdx !== -1) {
                customProducts[customIdx] = {
                    ...customProducts[customIdx],
                    ...updatedData,
                    price: parseFloat(updatedData.price),
                    stock: parseInt(updatedData.stock),
                    barcode: updatedData.barcode || '',
                    photo: updatedData.photo || customProducts[customIdx].photo || '',
                    weight: updatedData.weight || '',
                    weightUnit: updatedData.weightUnit || 'g'
                };
                localStorage.setItem('pos_custom_products', JSON.stringify(customProducts));
            }

            // Save stock for all (handles the stock update)
            this.saveStock();
            return true;
        }
        return false;
    },

    // Delete product
    deleteProduct(productId) {
        const id = parseInt(productId);

        // Remove from in-memory data
        this.data.products = this.data.products.filter(p => p.id !== id);

        // Remove from custom products in localStorage
        const customProducts = JSON.parse(localStorage.getItem('pos_custom_products')) || [];
        const updatedCustomProducts = customProducts.filter(p => p.id !== id);
        localStorage.setItem('pos_custom_products', JSON.stringify(updatedCustomProducts));

        // Update stock map
        this.saveStock();

        return true;
    },

    // Update stock in memory and localStorage
    updateStock(productId, quantity) {
        const product = this.getProductById(productId);
        if (product) {
            product.stock -= quantity;
            this.saveStock();
        }
    },

    saveStock() {
        const stockMap = {};
        this.data.products.forEach(p => stockMap[p.id] = p.stock);
        localStorage.setItem('pos_stock', JSON.stringify(stockMap));
    },

    // Get all products
    getAllProducts() {
        return this.data ? this.data.products : [];
    },

    // Get product by ID
    getProductById(id) {
        return this.data.products.find(p => p.id === parseInt(id));
    },

    // Get product by Barcode
    getProductByBarcode(barcode) {
        if (!barcode) return null;
        return this.data.products.find(p => p.barcode === barcode);
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
            p.category.toLowerCase().includes(query) ||
            (p.barcode && p.barcode.toLowerCase().includes(query))
        );
    }
};
