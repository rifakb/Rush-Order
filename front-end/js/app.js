// RushOrder Frontend Application
class RushOrderApp {
    constructor() {
        // Mode konfigurasi (development atau production)
        this.isDevelopment = true; // Ubah ke false untuk mode production
        
        this.cart = new Map();
        this.customerData = null;
        this.menuItems = [];
        this.currentPage = 'login';
        this.API_BASE = this.isDevelopment ? 'http://localhost:8080/api' : '/api';
        this.sessionID = null;
        
        // Konstanta untuk kategori
        this.KATEGORI = {
            MAKANAN: 'makanan',
            MINUMAN: 'minuman',
            SNACK: 'snack',
            SEMUA: 'all'
        };
        
        this.init();
    }

    init() {
        console.log('Inisialisasi RushOrder App...');
        console.log(`Mode: ${this.isDevelopment ? 'Development' : 'Production'}`);
        
        this.bindEvents();
        this.loadFromSession();
        this.hideLoading();
        
        // Tambahkan event untuk back button browser
        window.addEventListener('popstate', () => this.handleBackNavigation());
        
        // Tampilkan indikator mode development jika aplikasi berjalan di mode development
        if (this.isDevelopment) {
            this.showDevModeIndicator();
        }
    }
    
    // Menampilkan indikator mode development
    showDevModeIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'dev-mode-indicator';
        indicator.textContent = '🛠️ Mode Development';
        document.body.appendChild(indicator);
    }

    // Menangani navigasi back browser
    handleBackNavigation() {
        // Jika user di halaman checkout atau success, kembali ke menu
        if (this.currentPage === 'checkout' || this.currentPage === 'success') {
            this.showPage('menuPage');
            return;
        }
        
        // Jika user di halaman menu dan ada cart sidebar terbuka, tutup dulu
        if (this.currentPage === 'menu') {
            const cartSidebar = document.getElementById('cartSidebar');
            if (cartSidebar.classList.contains('open')) {
                this.toggleCart();
                return;
            }
        }
    }

    bindEvents() {
        // Customer form submission
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCustomerLogin();
        });

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterMenuByCategory(e.target.dataset.category);
            });
        });

        // Overlay click to close cart
        document.getElementById('overlay').addEventListener('click', () => {
            this.toggleCart();
        });

        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Tutup cart jika ESC ditekan
                const cartSidebar = document.getElementById('cartSidebar');
                if (cartSidebar.classList.contains('open')) {
                    this.toggleCart();
                }
            }
        });
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId.replace('Page', '');
    }

    async handleCustomerLogin() {
        const nama = document.getElementById('nama').value.trim();
        const meja = parseInt(document.getElementById('meja').value);

        if (!nama || !meja || isNaN(meja) || meja <= 0) {
            this.showAlert('Mohon lengkapi nama dan nomor meja dengan benar', 'error');
            return;
        }

        this.showLoading();

        try {
            if (!this.isDevelopment) {
                // Production mode: Create session dengan backend API
                const response = await fetch(`${this.API_BASE}/customer/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nama, meja }),
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    this.customerData = { nama, meja };
                    this.sessionID = result.session_id;
                    this.saveToSession();
                    this.updateCustomerInfo();
                    await this.loadMenu();
                    this.showPage('menuPage');
                } else {
                    throw new Error(result.error || 'Gagal login');
                }
            } else {
                // Development mode: simulasi login
                console.log('Mode development: Simulasi login pelanggan');
                await this.simulateDelay(800); // Simulasi network delay
                
                this.customerData = { nama, meja };
                this.sessionID = `session-${Date.now()}`;
                this.saveToSession();
                this.updateCustomerInfo();
                await this.loadMenu();
                this.showPage('menuPage');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Gagal login. Silakan coba lagi: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Fungsi simulasi delay untuk development
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateCustomerInfo() {
        if (this.customerData) {
            document.getElementById('customerName').textContent = this.customerData.nama;
            document.getElementById('tableNumber').textContent = this.customerData.meja;
            document.getElementById('checkoutName').textContent = this.customerData.nama;
            document.getElementById('checkoutTable').textContent = this.customerData.meja;
        }
    }

    async loadMenu() {
        try {
            this.showLoading();
            
            if (!this.isDevelopment) {
                // Production mode: Ambil data dari API backend
                const response = await fetch(`${this.API_BASE}/products`, {
                    headers: {
                        'X-Session-ID': this.sessionID
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        this.menuItems = result.data.map(item => ({
                            id_produk: item.id_produk,
                            nama_produk: item.nama_produk,
                            harga_produk: parseInt(item.harga_produk),
                            kategori: this.mapKategori(item.kategori || item.id_produk),
                            deskripsi: item.deskripsi || `${item.nama_produk} lezat dan bergizi`,
                            icon: this.getIconForProduct(item.kategori || item.id_produk)
                        }));
                    } else {
                        throw new Error("Format data tidak sesuai");
                    }
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } else {
                // Development mode: menggunakan mock data
                console.log('Mode development: Menggunakan data menu simulasi');
                await this.simulateDelay(800);
                this.menuItems = this.getMockMenuData();
            }
        } catch (error) {
            console.warn('Gagal memuat menu dari API:', error.message);
            // Fallback ke mock data
            this.menuItems = this.getMockMenuData();
            this.showAlert('Menggunakan data menu offline', 'info');
        } finally {
            this.renderMenu();
            this.hideLoading();
        }
    }

    getMockMenuData() {
        return [
            {
                id_produk: 'FOOD001',
                nama_produk: 'Nasi Goreng Spesial',
                harga_produk: 25000,
                kategori: 'makanan',
                deskripsi: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
                icon: 'fas fa-utensils'
            },
            {
                id_produk: 'FOOD002',
                nama_produk: 'Mie Ayam Bakso',
                harga_produk: 22000,
                kategori: 'makanan',
                deskripsi: 'Mie ayam dengan bakso sapi dan pangsit goreng',
                icon: 'fas fa-utensils'
            },
            {
                id_produk: 'DRINK001',
                nama_produk: 'Es Teh Manis',
                harga_produk: 8000,
                kategori: 'minuman',
                deskripsi: 'Teh manis segar dengan es batu',
                icon: 'fas fa-glass-water'
            },
            {
                id_produk: 'DRINK002',
                nama_produk: 'Jus Jeruk',
                harga_produk: 12000,
                kategori: 'minuman',
                deskripsi: 'Jus jeruk segar tanpa pemanis tambahan',
                icon: 'fas fa-glass-water'
            },
            {
                id_produk: 'SNACK001',
                nama_produk: 'Kentang Goreng',
                harga_produk: 15000,
                kategori: 'snack',
                deskripsi: 'Kentang goreng renyah dengan saus sambal dan mayonaise',
                icon: 'fas fa-cookie'
            },
            {
                id_produk: 'SNACK002',
                nama_produk: 'Pisang Goreng',
                harga_produk: 10000,
                kategori: 'snack',
                deskripsi: 'Pisang goreng crispy dengan toping coklat dan keju',
                icon: 'fas fa-cookie'
            }
        ];
    }
    
    mapKategori(kategoriOrId) {
        // Jika input adalah kategori yang valid, langsung gunakan
        if ([this.KATEGORI.MAKANAN, this.KATEGORI.MINUMAN, this.KATEGORI.SNACK].includes(kategoriOrId.toLowerCase())) {
            return kategoriOrId.toLowerCase();
        }
        
        // Jika tidak, coba tentukan dari ID produk
        const id = kategoriOrId.toUpperCase();
        if (id.startsWith('FOOD')) return this.KATEGORI.MAKANAN;
        if (id.startsWith('DRINK')) return this.KATEGORI.MINUMAN;
        if (id.startsWith('SNACK')) return this.KATEGORI.SNACK;
        return this.KATEGORI.MAKANAN; // Default ke makanan
    }
    
    getIconForProduct(kategoriOrId) {
        // Map kategori ke icon FontAwesome
        const kategori = this.mapKategori(kategoriOrId);
        switch(kategori) {
            case this.KATEGORI.MAKANAN:
                return 'fas fa-utensils';
            case this.KATEGORI.MINUMAN:
                return 'fas fa-glass-water';
            case this.KATEGORI.SNACK:
                return 'fas fa-cookie';
            default:
                return 'fas fa-utensils';
        }
    }

    renderMenu(filteredItems = null) {
        const menuGrid = document.getElementById('menuGrid');
        const items = filteredItems || this.menuItems;

        if (items.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>Menu tidak tersedia</h3>
                    <p>Belum ada menu untuk kategori ini</p>
                </div>
            `;
            return;
        }

        menuGrid.innerHTML = items.map(item => `
            <div class="menu-item fade-in">
                <div class="menu-item-image">
                    <i class="${item.icon}"></i>
                </div>
                <div class="menu-item-content">
                    <h3 class="menu-item-title">${item.nama_produk}</h3>
                    <p class="menu-item-description">${item.deskripsi}</p>
                    <div class="menu-item-price">Rp ${this.formatPrice(item.harga_produk)}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="app.changeQuantity('${item.id_produk}', -1)">-</button>
                        <input type="number" class="quantity-input" id="qty-${item.id_produk}" value="1" min="1" max="10">
                        <button class="quantity-btn" onclick="app.changeQuantity('${item.id_produk}', 1)">+</button>
                    </div>
                    <button class="add-to-cart-btn" onclick="app.addToCart('${item.id_produk}')">
                        <i class="fas fa-plus"></i>
                        Tambah ke Keranjang
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterMenuByCategory(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Filter and render menu
        if (category === 'all') {
            this.renderMenu();
        } else {
            const filtered = this.menuItems.filter(item => item.kategori === category);
            this.renderMenu(filtered);
        }
    }

    changeQuantity(productId, change) {
        const input = document.getElementById(`qty-${productId}`);
        const currentValue = parseInt(input.value);
        const newValue = Math.max(1, Math.min(10, currentValue + change));
        input.value = newValue;
    }

    async addToCart(productId) {
        const item = this.menuItems.find(item => item.id_produk === productId);
        const quantity = parseInt(document.getElementById(`qty-${productId}`).value);

        if (!item || isNaN(quantity) || quantity <= 0) {
            this.showAlert('Gagal menambahkan item ke keranjang', 'error');
            return;
        }

        // Tambahkan item ke cart lokal
        if (this.cart.has(productId)) {
            const existingItem = this.cart.get(productId);
            existingItem.jumlah += quantity;
            existingItem.subtotal = existingItem.jumlah * existingItem.harga;
        } else {
            this.cart.set(productId, {
                id_produk: item.id_produk,
                nama_produk: item.nama_produk,
                harga: item.harga_produk,
                jumlah: quantity,
                subtotal: item.harga_produk * quantity
            });
        }

        // Update cart di backend jika bukan mode development
        if (!this.isDevelopment) {
            try {
                await fetch(`${this.API_BASE}/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': this.sessionID
                    },
                    body: JSON.stringify({
                        id_produk: item.id_produk,
                        jumlah: quantity
                    })
                });
            } catch (error) {
                console.warn('Gagal sinkronisasi cart dengan backend:', error);
                // Tetap lanjutkan dengan cart lokal
            }
        } else {
            // Development mode: simulasi
            console.log('Mode development: Item berhasil ditambahkan ke cart');
        }

        this.updateCartDisplay();
        this.saveToSession();
        this.showAlert(`${item.nama_produk} ditambahkan ke keranjang`, 'success');

        // Reset quantity to 1
        document.getElementById(`qty-${productId}`).value = 1;
        
        // Animasikan icon cart
        this.animateCartIcon();
    }
    
    // Fungsi untuk animasi visual ketika item ditambahkan ke cart
    animateCartIcon() {
        const cartIcon = document.querySelector('.cart-icon');
        cartIcon.classList.add('cart-pulse');
        setTimeout(() => {
            cartIcon.classList.remove('cart-pulse');
        }, 500);
    }

    async removeFromCart(productId) {
        this.cart.delete(productId);
        
        // Coba hapus dari cart di backend
        try {
            if (this.sessionID) {
                await fetch(`${this.API_BASE}/cart/remove/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Session-ID': this.sessionID
                    }
                });
            }
        } catch (error) {
            console.warn('Gagal menghapus item dari cart backend:', error);
            // Tetap lanjutkan dengan cart lokal
        }
        
        this.updateCartDisplay();
        this.saveToSession();
    }

    async updateCartQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const item = this.cart.get(productId);
        if (item) {
            item.jumlah = newQuantity;
            item.subtotal = item.harga * newQuantity;
            
            // Update cart di backend
            try {
                if (this.sessionID) {
                    await fetch(`${this.API_BASE}/cart/update`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Session-ID': this.sessionID
                        },
                        body: JSON.stringify({
                            id_produk: productId,
                            jumlah: newQuantity
                        })
                    });
                }
            } catch (error) {
                console.warn('Gagal update quantity di backend:', error);
                // Tetap lanjutkan dengan cart lokal
            }
            
            this.updateCartDisplay();
            this.saveToSession();
        }
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        // Update cart count
        const totalItems = Array.from(this.cart.values()).reduce((sum, item) => sum + item.jumlah, 0);
        cartCount.textContent = totalItems;

        // Update cart items
        if (this.cart.size === 0) {
            cartItems.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Keranjang Kosong</h3>
                    <p>Belum ada item di keranjang</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = Array.from(this.cart.values()).map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.nama_produk}</h4>
                        <p>Rp ${this.formatPrice(item.harga)} x ${item.jumlah}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="app.updateCartQuantity('${item.id_produk}', ${item.jumlah - 1})">-</button>
                        <span>${item.jumlah}</span>
                        <button class="quantity-btn" onclick="app.updateCartQuantity('${item.id_produk}', ${item.jumlah + 1})">+</button>
                        <button class="quantity-btn" style="color: #e53e3e; margin-left: 10px;" onclick="app.removeFromCart('${item.id_produk}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Update total
        const total = Array.from(this.cart.values()).reduce((sum, item) => sum + item.subtotal, 0);
        cartTotal.textContent = this.formatPrice(total);
        document.getElementById('checkoutTotal').textContent = this.formatPrice(total);

        // Update checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn.disabled = this.cart.size === 0;
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        const isOpen = cartSidebar.classList.contains('open');
        
        if (isOpen) {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            cartSidebar.classList.add('open');
            overlay.classList.add('active');
        }
    }

    goToCheckout() {
        if (this.cart.size === 0) {
            this.showAlert('Keranjang masih kosong', 'error');
            return;
        }

        this.updateCheckoutDisplay();
        this.showPage('checkoutPage');
        this.toggleCart(); // Close cart sidebar
    }

    updateCheckoutDisplay() {
        const checkoutItems = document.getElementById('checkoutItems');
        
        checkoutItems.innerHTML = Array.from(this.cart.values()).map(item => `
            <div class="checkout-item">
                <div>
                    <strong>${item.nama_produk}</strong><br>
                    <small>Rp ${this.formatPrice(item.harga)} x ${item.jumlah}</small>
                </div>
                <div>
                    <strong>Rp ${this.formatPrice(item.subtotal)}</strong>
                </div>
            </div>
        `).join('');
    }

    backToMenu() {
        this.showPage('menuPage');
    }

    async processPayment() {
        if (this.cart.size === 0) {
            this.showAlert('Keranjang kosong', 'error');
            return;
        }

        this.showLoading();

        try {
            // Prepare order data
            const orderItems = Array.from(this.cart.values()).map(item => ({
                id_produk: item.id_produk,
                jumlah: item.jumlah,
                harga: item.harga
            }));

            if (!this.isDevelopment) {
                // Production mode: Kirim ke backend API
                const idPemesan = this.customerData.id || `P${Date.now()}`;

                const orderResponse = await fetch(`${this.API_BASE}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': this.sessionID
                    },
                    body: JSON.stringify({
                        id_pemesan: idPemesan,
                        items: orderItems
                    })
                });

                if (!orderResponse.ok) {
                    throw new Error(`Error ${orderResponse.status}: ${orderResponse.statusText}`);
                }

                const orderResult = await orderResponse.json();
                console.log('Order created:', orderResult);
                
                // Clear backend cart
                try {
                    await fetch(`${this.API_BASE}/cart/clear`, {
                        method: 'DELETE',
                        headers: {
                            'X-Session-ID': this.sessionID
                        }
                    });
                } catch (err) {
                    console.warn('Gagal menghapus cart di backend:', err);
                }
            } else {
                // Development mode: simulasi
                console.log('Mode development: Simulasi pemrosesan pembayaran');
                await this.simulateDelay(1500);
            }
            
            // Generate receipt
            this.generateReceipt();
            
            // Show success page
            this.showPage('successPage');
            
            // Play success sound if available
            this.playSound('success');
            
            this.showAlert('Pembayaran berhasil!', 'success');
        } catch (error) {
            console.error('Payment error:', error);
            this.showAlert('Pembayaran gagal: ' + error.message, 'error');
            
            // Fallback untuk development mode
            if (this.isDevelopment) {
                console.log('Mode development: Lanjutkan dengan simulasi pemesanan berhasil');
                this.generateReceipt();
                this.showPage('successPage');
                this.showAlert('Pembayaran berhasil (mode simulasi)!', 'success');
            }
        } finally {
            this.hideLoading();
        }
    }
    
    // Fungsi untuk memutar suara notifikasi
    playSound(type) {
        try {
            const sound = document.getElementById(`${type}Sound`);
            if (sound) {
                sound.currentTime = 0;
                sound.play();
            }
        } catch (e) {
            console.warn('Error memutar suara:', e);
        }
    }

    generateReceipt() {
        const receiptContent = document.getElementById('receiptContent');
        const total = Array.from(this.cart.values()).reduce((sum, item) => sum + item.subtotal, 0);
        const orderTime = new Date().toLocaleString('id-ID');

        receiptContent.innerHTML = `
            <div style="font-family: monospace; line-height: 1.4;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <strong>RUSHORDER RESTAURANT</strong><br>
                    Struk Digital
                </div>
                <div style="border-bottom: 1px dashed #ccc; margin-bottom: 15px; padding-bottom: 15px;">
                    <strong>Data Pelanggan:</strong><br>
                    Nama: ${this.customerData.nama}<br>
                    Meja: ${this.customerData.meja}<br>
                    Waktu: ${orderTime}
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Pesanan:</strong><br>
                    ${Array.from(this.cart.values()).map(item => 
                        `${item.nama_produk}<br>  ${item.jumlah} x Rp ${this.formatPrice(item.harga)} = Rp ${this.formatPrice(item.subtotal)}`
                    ).join('<br>')}
                </div>
                <div style="border-top: 1px dashed #ccc; padding-top: 15px; text-align: center;">
                    <strong>TOTAL: Rp ${this.formatPrice(total)}</strong>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.9em;">
                    Terima kasih atas kunjungan Anda!<br>
                    Pesanan akan segera disiapkan.
                </div>
            </div>
        `;
    }

    downloadReceipt() {
        const receiptContent = document.getElementById('receiptContent').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Struk Digital - RushOrder</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .receipt { max-width: 400px; margin: 0 auto; }
                    </style>
                </head>
                <body>
                    <div class="receipt">${receiptContent}</div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    newOrder() {
        // Clear cart and return to menu
        this.cart.clear();
        this.updateCartDisplay();
        this.saveToSession();
        
        // Clear backend cart (aspek)
        if (this.sessionID) {
            fetch(`${this.API_BASE}/cart/clear`, {
                method: 'DELETE',
                headers: {
                    'X-Session-ID': this.sessionID
                }
            }).catch(err => console.warn('Failed to clear backend cart:', err));
        }
        
        this.showPage('menuPage');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('id-ID').format(price);
    }

    saveToSession() {
        const sessionData = {
            customerData: this.customerData,
            cart: Array.from(this.cart.entries()),
            sessionID: this.sessionID
        };
        localStorage.setItem('rushorder_session', JSON.stringify(sessionData));
    }

    loadFromSession() {
        const sessionData = localStorage.getItem('rushorder_session');
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                this.customerData = data.customerData;
                this.cart = new Map(data.cart || []);
                this.sessionID = data.sessionID;
                
                if (this.customerData) {
                    this.updateCustomerInfo();
                    this.loadMenu().then(() => {
                        this.updateCartDisplay();
                        this.showPage('menuPage');
                    });
                }
            } catch (error) {
                console.error('Error loading session:', error);
                localStorage.removeItem('rushorder_session');
            }
        }
    }

    clearSession() {
        localStorage.removeItem('rushorder_session');
        this.cart.clear();
        this.customerData = null;
        this.sessionID = null;
        this.showPage('loginPage');
        
        // Logout dari backend juga jika perlu
        if (this.sessionID) {
            fetch(`${this.API_BASE}/customer/logout`, {
                method: 'POST',
                headers: {
                    'X-Session-ID': this.sessionID
                }
            }).catch(err => console.warn('Logout from backend failed:', err));
        }
    }

    showAlert(message, type = 'info') {
        // Simple alert implementation
        // In production, you might want to use a toast library
        const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
        
        // Remove existing alerts
        const existingAlert = document.querySelector('.app-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `app-alert ${alertClass}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fee' : '#efe'};
            color: ${type === 'error' ? '#c53030' : '#2f855a'};
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid ${type === 'error' ? '#e53e3e' : '#48bb78'};
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
            animation: slideInFromRight 0.3s ease-out;
        `;
        alert.textContent = message;

        document.body.appendChild(alert);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOutToRight 0.3s ease-in';
                setTimeout(() => alert.remove(), 300);
            }
        }, 3000);
    }
}

// Global functions for onclick handlers
window.toggleCart = function() {
    app.toggleCart();
};

window.goToCheckout = function() {
    app.goToCheckout();
};

window.backToMenu = function() {
    app.backToMenu();
};

window.processPayment = function() {
    app.processPayment();
};

window.downloadReceipt = function() {
    app.downloadReceipt();
};

window.newOrder = function() {
    app.newOrder();
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new RushOrderApp();

    // Add CSS animations for alerts
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutToRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// Handle QR code scanning (table parameter from URL)
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    if (tableId) {
        // Pre-fill table number if accessed via QR code
        const mejaInput = document.getElementById('meja');
        if (mejaInput) {
            mejaInput.value = tableId;
        }
    }
});