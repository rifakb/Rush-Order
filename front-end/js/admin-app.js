// RushOrder Admin Application
class AdminApp {
    constructor() {
        // Mode konfigurasi (development atau production)
        this.isDevelopment = true; // Ubah ke false untuk mode production
        
        this.adminData = null;
        this.orders = [];
        this.currentTab = 'pending';
        this.API_BASE = this.isDevelopment ? 'http://localhost:8080/api/admin' : '/api/admin';
        this.refreshInterval = null;
        this.refreshTime = 30000; // 30 detik
        
        this.init();
    }

    init() {
        console.log('Inisialisasi RushOrder Admin Dashboard...');
        console.log(`Mode: ${this.isDevelopment ? 'Development' : 'Production'}`);
        
        this.bindEvents();
        this.loadFromSession();
        this.hideLoading();
        
        // Auto refresh setiap 30 detik jika sudah login
        this.setupAutoRefresh();
        
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
    
    // Fungsi simulasi delay untuk development
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupAutoRefresh() {
        // Clear existing interval if any
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Setup refresh interval jika sudah login
        if (this.adminData) {
            this.refreshInterval = setInterval(() => {
                this.refreshOrders(true); // silent refresh
            }, this.refreshTime);
            
            // Tambahkan listener untuk tab visibility
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    // Refresh ketika tab menjadi visible lagi
                    this.refreshOrders(true);
                }
            });
        }
    }

    bindEvents() {
        // Login form submission
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Overlay click to close modal
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeModal();
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
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showAlert('Mohon lengkapi username dan password', 'error');
            return;
        }

        this.showLoading();

        try {
            if (!this.isDevelopment) {
                // Production mode: Coba login dengan API backend
                const response = await fetch(`${this.API_BASE}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();
                
                if (response.ok && result.success) {
                    this.adminData = { 
                        username,
                        id: result.admin?.id || 1,
                        name: result.admin?.name || username,
                        loginTime: new Date()
                    };
                    this.saveToSession();
                    this.updateAdminInfo();
                    await this.loadOrders();
                    this.showPage('dashboardPage');
                    this.setupAutoRefresh();
                    
                    this.showAlert('Login berhasil! Selamat datang di dashboard admin.', 'success');
                } else {
                    throw new Error(result.error || 'Username atau password salah');
                }
            } else {
                // Development mode: simulasi login dengan admin/password123
                console.log('Mode development: Simulasi login admin');
                await this.simulateDelay(800);
                
                if (username === 'admin' && password === 'password123') {
                    this.adminData = { 
                        username, 
                        id: 1,
                        name: 'Administrator',
                        loginTime: new Date()
                    };
                    this.saveToSession();
                    this.updateAdminInfo();
                    await this.loadOrders();
                    this.showPage('dashboardPage');
                    this.setupAutoRefresh();
                    
                    // Play notification sound
                    this.playSound('success');
                    
                    this.showAlert('Login berhasil! Selamat datang di dashboard admin.', 'success');
                } else {
                    throw new Error('Username atau password salah');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert(error.message || 'Login gagal. Silakan periksa kredensial Anda.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateAdminInfo() {
        if (this.adminData) {
            document.getElementById('adminName').textContent = this.adminData.name || this.adminData.username;
        }
    }

    async loadOrders() {
        try {
            this.showLoading();
            
            if (!this.isDevelopment) {
                // Production mode: Ambil data dari API backend
                const response = await fetch(`${this.API_BASE}/orders`, {
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        this.orders = result.data;
                    } else {
                        throw new Error('Format data tidak sesuai');
                    }
                } else {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            } else {
                // Development mode: simulasi data
                console.log('Mode development: Menggunakan data pesanan simulasi');
                await this.simulateDelay(1000);
                this.orders = this.getMockOrders();
            }
        } catch (error) {
            console.warn('Error memuat pesanan:', error.message);
            // Fallback ke data mock untuk development
            this.orders = this.getMockOrders();
        } finally {
            this.updateDashboard();
            this.hideLoading();
        }
    }

    getMockOrders() {
        // Mock data untuk demonstrasi
        const now = new Date();
        return [
            {
                id: 'ORD001',
                namaPemesan: 'Ahmad Yudi',
                noMeja: 5,
                items: [
                    { nama: 'Nasi Goreng Spesial', jumlah: 1, harga: 25000 },
                    { nama: 'Es Teh Manis', jumlah: 2, harga: 8000 }
                ],
                total: 41000,
                status: 'pending',
                waktuPesan: new Date(now.getTime() - 10 * 60000) // 10 menit lalu
            },
            {
                id: 'ORD002',
                namaPemesan: 'Sari Dewi',
                noMeja: 3,
                items: [
                    { nama: 'Mie Ayam Bakso', jumlah: 1, harga: 20000 },
                    { nama: 'Jus Jeruk Segar', jumlah: 1, harga: 15000 }
                ],
                total: 35000,
                status: 'pending',
                waktuPesan: new Date(now.getTime() - 5 * 60000) // 5 menit lalu
            },
            {
                id: 'ORD003',
                namaPemesan: 'Budi Santoso',
                noMeja: 1,
                items: [
                    { nama: 'Pisang Goreng', jumlah: 2, harga: 10000 },
                    { nama: 'Es Teh Manis', jumlah: 1, harga: 8000 }
                ],
                total: 28000,
                status: 'completed',
                waktuPesan: new Date(now.getTime() - 30 * 60000), // 30 menit lalu
                waktuSelesai: new Date(now.getTime() - 15 * 60000) // 15 menit lalu
            },
            {
                id: 'ORD004',
                namaPemesan: 'Linda Sari',
                noMeja: 7,
                items: [
                    { nama: 'Nasi Goreng Spesial', jumlah: 2, harga: 25000 },
                    { nama: 'Kerupuk Udang', jumlah: 1, harga: 5000 }
                ],
                total: 55000,
                status: 'completed',
                waktuPesan: new Date(now.getTime() - 45 * 60000), // 45 menit lalu
                waktuSelesai: new Date(now.getTime() - 25 * 60000) // 25 menit lalu
            }
        ];
    }

    updateDashboard() {
        this.updateStatistics();
        this.renderOrders();
        this.updateTabBadges();
    }

    updateStatistics() {
        const pendingOrders = this.orders.filter(order => order.status === 'pending');
        const completedOrders = this.orders.filter(order => order.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

        document.getElementById('pendingCount').textContent = pendingOrders.length;
        document.getElementById('completedCount').textContent = completedOrders.length;
        document.getElementById('totalRevenue').textContent = this.formatPrice(totalRevenue);
        document.getElementById('totalOrders').textContent = this.orders.length;
    }

    renderOrders() {
        const pendingOrders = this.orders.filter(order => order.status === 'pending');
        const completedOrders = this.orders.filter(order => order.status === 'completed');

        this.renderOrderList('pendingOrders', pendingOrders, 'pending');
        this.renderOrderList('completedOrders', completedOrders, 'completed');
    }

    renderOrderList(containerId, orders, status) {
        const container = document.getElementById(containerId);

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-${status === 'pending' ? 'clock' : 'check-circle'}"></i>
                    <h3>Tidak Ada Pesanan ${status === 'pending' ? 'Menunggu' : 'Selesai'}</h3>
                    <p>${status === 'pending' ? 'Belum ada pesanan yang perlu diproses' : 'Belum ada pesanan yang selesai hari ini'}</p>
                </div>
            `;
            return;
        }

        // Urutkan pesanan berdasarkan waktu (terbaru di atas)
        const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.waktuPesan);
            const dateB = new Date(b.waktuPesan);
            return dateB - dateA;
        });

        container.innerHTML = sortedOrders.map(order => `
            <div class="order-card ${status} fade-in" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>${order.namaPemesan}</h3>
                        <p><i class="fas fa-table"></i> Meja ${order.noMeja}</p>
                    </div>
                    <div class="order-time">
                        <div class="order-status ${status}">${status === 'pending' ? 'Menunggu' : 'Selesai'}</div>
                        <p>${this.formatTime(order.waktuPesan)}</p>
                        ${order.waktuSelesai ? `<p><small>Selesai: ${this.formatTime(order.waktuSelesai)}</small></p>` : ''}
                    </div>
                </div>
                
                <div class="order-items">
                    <h4><i class="fas fa-utensils"></i> Item Pesanan:</h4>
                    <div class="item-list">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div>
                                    <span class="item-name">${item.nama}</span>
                                    <span class="item-quantity"> x${item.jumlah}</span>
                                </div>
                                <span class="item-price">Rp ${this.formatPrice(item.harga * item.jumlah)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="order-total">
                    <span>Total Pesanan:</span>
                    <span>Rp ${this.formatPrice(order.total)}</span>
                </div>
                
                <div class="order-actions">
                    <button class="btn-secondary" onclick="adminApp.showOrderDetail('${order.id}')">
                        <i class="fas fa-eye"></i>
                        Detail
                    </button>
                    ${status === 'pending' ? `
                        <button class="btn-primary" onclick="adminApp.markAsComplete('${order.id}')">
                            <i class="fas fa-check"></i>
                            Tandai Selesai
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    updateTabBadges() {
        const pendingCount = this.orders.filter(order => order.status === 'pending').length;
        const completedCount = this.orders.filter(order => order.status === 'completed').length;

        document.getElementById('pendingBadge').textContent = pendingCount;
        document.getElementById('completedBadge').textContent = completedCount;
        
        // Add notification animation jika ada pesanan baru
        if (pendingCount > 0) {
            const pendingTab = document.querySelector('[data-tab="pending"]');
            // Tambahkan animasi notifikasi jika belum ada
            if (!pendingTab.classList.contains('has-notification')) {
                pendingTab.classList.add('has-notification');
                setTimeout(() => {
                    pendingTab.classList.remove('has-notification');
                }, 3000); // Hapus animasi setelah 3 detik
            }
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;
    }

    showOrderDetail(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('orderModal');
        const content = document.getElementById('orderDetailContent');
        const footer = document.getElementById('orderModalFooter');

        content.innerHTML = `
            <div class="order-detail">
                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> Informasi Pemesan</h4>
                    <p><strong>Nama:</strong> ${order.namaPemesan}</p>
                    <p><strong>Nomor Meja:</strong> ${order.noMeja}</p>
                    <p><strong>Waktu Pesan:</strong> ${this.formatDateTime(order.waktuPesan)}</p>
                    ${order.waktuSelesai ? `<p><strong>Waktu Selesai:</strong> ${this.formatDateTime(order.waktuSelesai)}</p>` : ''}
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-utensils"></i> Detail Pesanan</h4>
                    <div class="item-list">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div>
                                    <span class="item-name">${item.nama}</span><br>
                                    <small class="item-quantity">Rp ${this.formatPrice(item.harga)} x ${item.jumlah}</small>
                                </div>
                                <span class="item-price">Rp ${this.formatPrice(item.harga * item.jumlah)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="order-total">
                        <span>Total Pesanan:</span>
                        <span>Rp ${this.formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>
        `;

        footer.innerHTML = `
            ${order.status === 'pending' ? `
                <button class="btn-primary" onclick="adminApp.markAsComplete('${order.id}'); adminApp.closeModal();">
                    <i class="fas fa-check"></i>
                    Tandai Selesai
                </button>
            ` : ''}
            <button class="btn-secondary" onclick="adminApp.closeModal()">
                <i class="fas fa-times"></i>
                Tutup
            </button>
        `;

        modal.classList.add('active');
        document.getElementById('overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('orderModal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    async markAsComplete(orderId) {
        try {
            this.showLoading();
            
            if (!this.isDevelopment) {
                // Production mode: Coba update status melalui API
                const response = await fetch(`${this.API_BASE}/orders/${orderId}/complete`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Gagal update status pesanan');
                }
            } else {
                // Development mode: simulasi
                console.log('Mode development: Simulasi menandai pesanan selesai');
                await this.simulateDelay(800);
            }
            
            // Update order status locally
            const orderIndex = this.orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex].status = 'completed';
                this.orders[orderIndex].waktuSelesai = new Date();
                
                // Highlight card with animation
                const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
                if (orderCard) {
                    orderCard.classList.add('order-completed');
                }
            }
            
            // Update dashboard after 1sec (for animation)
            setTimeout(() => {
                this.updateDashboard();
                if (this.currentTab === 'pending') {
                    setTimeout(() => {
                        this.switchTab('completed');
                    }, 500);
                }
            }, 1000);
            
            this.showAlert('Pesanan berhasil ditandai sebagai selesai!', 'success');
            
            // Play notification sound
            this.playSound('success');
            
        } catch (error) {
            console.error('Error marking order as complete:', error);
            this.showAlert('Gagal menandai pesanan sebagai selesai: ' + error.message, 'error');
            
            if (this.isDevelopment) {
                // Development mode fallback: proceed anyway
                console.log('Mode development: Lanjutkan simulasi update status pesanan');
                
                const orderIndex = this.orders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    this.orders[orderIndex].status = 'completed';
                    this.orders[orderIndex].waktuSelesai = new Date();
                    
                    setTimeout(() => {
                        this.updateDashboard();
                        if (this.currentTab === 'pending') {
                            setTimeout(() => {
                                this.switchTab('completed');
                            }, 500);
                        }
                    }, 1000);
                    this.showAlert('Pesanan berhasil ditandai sebagai selesai! (mode simulasi)', 'success');
                    this.playSound('success');
                }
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

    async refreshOrders(silent = false) {
        try {
            if (!silent) this.showLoading();
            
            if (!this.isDevelopment) {
                // Production mode: Ambil data terbaru dari API
                const response = await fetch(`${this.API_BASE}/orders`, {
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        // Cek apakah ada pesanan baru
                        const newPendingCount = result.data.filter(o => o.status === 'pending').length;
                        const oldPendingCount = this.orders.filter(o => o.status === 'pending').length;
                        
                        this.orders = result.data;
                        this.updateDashboard();
                        
                        // Notifikasi jika ada pesanan baru
                        if (newPendingCount > oldPendingCount && !silent) {
                            this.showAlert(`Ada ${newPendingCount - oldPendingCount} pesanan baru!`, 'success');
                            this.playSound('notification');
                        }
                    }
                } else {
                    throw new Error('Gagal memperbarui data');
                }
            } else {
                // Development mode: simulasi refresh dengan 30% chance untuk new order
                console.log('Mode development: Simulasi refresh data orders');
                await this.simulateDelay(800);
                
                // Simulasi pesanan baru masuk (30% chance)
                if (Math.random() < 0.3 && !silent) {
                    const newOrder = this.generateRandomOrder();
                    this.orders.push(newOrder);
                    this.updateDashboard();
                    this.showAlert('Ada pesanan baru masuk!', 'success');
                    this.playSound('notification');
                }
            }
            
            if (!silent) {
                this.showAlert('Data pesanan berhasil diperbarui', 'success');
            }
        } catch (error) {
            console.warn('Refresh error:', error);
            if (!silent) {
                this.showAlert('Gagal memperbarui data pesanan', 'error');
            }
        } finally {
            if (!silent) this.hideLoading();
        }
    }
    
    // Generate random order untuk simulasi di development mode
    generateRandomOrder() {
        const names = ['Budi Santoso', 'Siti Rahayu', 'Agus Setiawan', 'Dewi Lestari', 'Joko Widodo'];
        const menuItems = [
            { nama: 'Nasi Goreng Spesial', harga: 25000 },
            { nama: 'Mie Ayam Bakso', harga: 22000 },
            { nama: 'Es Teh Manis', harga: 8000 },
            { nama: 'Jus Jeruk', harga: 12000 },
            { nama: 'Soto Ayam', harga: 20000 }
        ];
        
        // Generate random order
        const randomName = names[Math.floor(Math.random() * names.length)];
        const tableNumber = Math.floor(Math.random() * 10) + 1;
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const orderItems = [];
        let total = 0;
        
        // Generate random items
        for (let i = 0; i < itemCount; i++) {
            const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;
            orderItems.push({
                nama: menuItem.nama,
                harga: menuItem.harga,
                jumlah: quantity
            });
            total += menuItem.harga * quantity;
        }
        
        // Create order object
        return {
            id: 'ORD' + Date.now().toString().substr(-6),
            namaPemesan: randomName,
            noMeja: tableNumber,
            items: orderItems,
            total: total,
            status: 'pending',
            waktuPesan: new Date()
        };
    }

    logout() {
        if (confirm('Yakin ingin logout dari dashboard admin?')) {
            // Clear refresh interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            
            // Coba logout dari API jika perlu
            if (this.adminData) {
                fetch(`${this.API_BASE}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                }).catch(e => console.warn('Logout API error:', e));
            }
            
            this.clearSession();
            this.showPage('loginPage');
            this.showAlert('Logout berhasil. Terima kasih!', 'success');
            
            // Reset form
            document.getElementById('adminLoginForm').reset();
        }
    }

    getAuthToken() {
        // Implementasi sederhana untuk auth token
        return this.adminData ? `admin-token-${this.adminData.username}` : '';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('id-ID').format(price);
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    saveToSession() {
        const sessionData = {
            adminData: this.adminData,
            loginTime: new Date()
        };
        localStorage.setItem('rushorder_admin_session', JSON.stringify(sessionData));
    }

    loadFromSession() {
        const sessionData = localStorage.getItem('rushorder_admin_session');
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                // Check if session is expired (8 hours)
                const loginTime = new Date(data.loginTime || Date.now());
                const isValid = new Date() - loginTime < 8 * 60 * 60 * 1000;
                
                if (isValid) {
                    this.adminData = data.adminData;
                
                    if (this.adminData) {
                        this.updateAdminInfo();
                        this.loadOrders().then(() => {
                            this.showPage('dashboardPage');
                        });
                        return;
                    }
                } else {
                    // Session expired
                    throw new Error('Session expired');
                }
            } catch (error) {
                console.error('Error loading admin session:', error);
                localStorage.removeItem('rushorder_admin_session');
            }
        }
        
        // Default: show login page
        this.showPage('loginPage');
    }

    clearSession() {
        localStorage.removeItem('rushorder_admin_session');
        this.adminData = null;
        this.orders = [];
    }

    showAlert(message, type = 'info') {
        // Simple alert implementation
        const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
        
        // Remove existing alerts
        const existingAlert = document.querySelector('.admin-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `admin-alert ${alertClass}`;
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
            z-index: 10001;
            font-weight: 600;
            max-width: 350px;
            animation: slideInFromRight 0.3s ease-out;
        `;
        alert.textContent = message;

        document.body.appendChild(alert);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOutToRight 0.3s ease-in';
                setTimeout(() => alert.remove(), 300);
            }
        }, 4000);
    }
}

// Global functions for onclick handlers
window.adminApp = null;

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminApp = new AdminApp();

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
        .detail-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e1e5e9;
        }
        .detail-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .detail-section h4 {
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .detail-section p {
            margin-bottom: 8px;
            color: #666;
        }
        .detail-section strong {
            color: #333;
        }
    `;
    document.head.appendChild(style);
});

// Handle browser refresh - maintain session
window.addEventListener('beforeunload', function() {
    if (window.adminApp && window.adminApp.adminData) {
        window.adminApp.saveToSession();
    }
});