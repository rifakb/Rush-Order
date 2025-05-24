# RushOrder AI Assistant Guidelines & Commands

## 📋 Project Overview
**Project Name:** RushOrder - Digital Restaurant Ordering System  
**Technology Stack:** Go (Backend), Vanilla JavaScript (Frontend), MySQL (Database)  
**Target:** University Web Development Course Project  
**Date Created:** May 24, 2025  

## 🎯 Project Context
RushOrder adalah sistem pemesanan makanan digital berbasis QR Code untuk restoran. Sistem ini memungkinkan pelanggan memesan makanan langsung dari meja mereka menggunakan smartphone, dan pegawai restoran mengelola pesanan melalui dashboard admin.

### Key Components:
- **Backend**: Go dengan Gin framework, GORM, MySQL
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)
- **Features**: QR Code scanning, digital menu, cart management, payment simulation, admin dashboard

## 🚫 AI Assistant Limitations & Guidelines

### ❌ WHAT NOT TO DO:
1. **No Framework Suggestions**: Jangan sarankan React, Vue, Angular, atau framework JS lainnya
2. **No Library Dependencies**: Hindari menambah library external yang tidak perlu
3. **No Production Secrets**: Jangan buat konfigurasi dengan data sensitif real
4. **No Overengineering**: Fokus pada kesederhanaan sesuai level mahasiswa
5. **No Breaking Changes**: Jangan ubah struktur database atau API yang sudah ada tanpa konfirmasi
6. **No English Code**: Semua komentar dan variable harus dalam Bahasa Indonesia yang sesuai konteks

### ✅ WHAT TO DO:
1. **Keep It Simple**: Gunakan vanilla JavaScript dan CSS murni
2. **Follow Existing Pattern**: Ikuti struktur kode yang sudah ada
3. **Indonesian Context**: Gunakan Bahasa Indonesia untuk UI dan komentar
4. **University Level**: Sesuaikan kompleksitas dengan level mahasiswa semester 4
5. **Documentation**: Selalu sertakan komentar yang jelas
6. **Responsive Design**: Pastikan semua UI responsive untuk mobile

## 📁 Project Structure Reference
```
RushOrder/
├── back-end/
│   ├── main.go
│   ├── config/db.go
│   ├── models/ (produk.go, order.go, pemesan.go, etc.)
│   ├── controller/
│   ├── service/
│   └── session/
├── front-end/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── admin/ (for future admin interface)
└── docs/
```

## 🎨 Design Requirements

### Color Scheme:
- Primary: `#667eea` (Purple Blue)
- Secondary: `#764ba2` (Purple)
- Success: `#48bb78` (Green)
- Error: `#e53e3e` (Red)
- Background: Linear gradient `#667eea` to `#764ba2`

### Typography:
- Font Family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- Responsive font sizes
- Indonesian locale number formatting

### UI Components:
- Rounded corners (8px-20px)
- Box shadows for depth
- Smooth transitions (0.3s ease)
- Mobile-first responsive design

## 🔧 Technical Specifications

### Frontend Requirements:
- **No Build Process**: Direct HTML/CSS/JS files
- **Session Management**: localStorage for cart persistence
- **API Integration**: Fetch API for backend communication
- **Mobile Responsive**: Works on smartphones primarily
- **QR Code Support**: URL parameters for table identification

### Backend Requirements:
- **Port**: 8080
- **Database**: MySQL with GORM
- **Session**: Cookie-based with gorilla/sessions
- **CORS**: Enabled for frontend communication
- **Validation**: Form validation on both client and server

## 📱 User Personas & Scenarios

### Persona 1: Yudi Wahyudi (Office Worker)
- **Need**: Quick ordering without queuing
- **Behavior**: Tech-savvy, time-conscious
- **Goal**: Order from seat without cashier interaction

### Persona 2: Arya Aryanto (Student)
- **Need**: Clear menu with prices, accurate orders
- **Behavior**: Budget-conscious, unfamiliar with menu
- **Goal**: Detailed menu view, cashless payment

## 🛠️ Mandatory Commands for AI Interactions

### Before Starting Any Task:
```markdown
**Context Check:**
- [ ] Konfirmasi apakah ini untuk RushOrder project
- [ ] Cek apakah perubahan sesuai dengan existing structure
- [ ] Pastikan tidak melanggar limitations yang sudah ditetapkan
```

### When Writing Code:
```markdown
**Code Standards:**
- [ ] Gunakan Bahasa Indonesia untuk komentar dan UI text
- [ ] Follow existing naming conventions
- [ ] Ensure mobile-responsive design
- [ ] Test pada smartphone view
- [ ] Validasi error handling
```

### When Making Changes:
```markdown
**Change Protocol:**
- [ ] Backup existing code sebelum major changes
- [ ] Test compatibility dengan existing features
- [ ] Update documentation jika diperlukan
- [ ] Konfirmasi dengan user sebelum breaking changes
```

## 📋 Feature Checklist

### Customer Interface (✅ Completed):
- [x] QR Code access via URL parameters
- [x] Customer login with name and table
- [x] Menu browsing with categories
- [x] Shopping cart with quantity controls
- [x] Checkout process with payment simulation
- [x] Digital receipt generation
- [x] Session persistence with localStorage

### Admin Interface (🚧 Pending):
- [ ] Staff login system
- [ ] Order management dashboard
- [ ] Real-time order updates
- [ ] Mark as done functionality
- [ ] Daily reports (optional)

### Backend Integration (🚧 Pending):
- [ ] API endpoints implementation
- [ ] Database schema completion
- [ ] Session management with backend
- [ ] Order processing workflow

## 🎯 Current Development Focus
**Priority 1**: Complete admin interface for restaurant staff  
**Priority 2**: Integrate frontend with Go backend APIs  
**Priority 3**: Add real-time features (WebSocket optional)  

## 📝 Usage Instructions for AI

### When Requesting Code Changes:
```markdown
**Required Information:**
1. Spesifikasi exact dari perubahan yang diinginkan
2. File mana yang perlu dimodifikasi
3. Apakah perubahan ini breaking change atau tidak
4. Testing requirements (manual testing on mobile/desktop)
```

### When Asking for New Features:
```markdown
**Required Context:**
1. User persona yang akan menggunakan feature ini
2. Integration dengan existing features
3. Batasan teknis yang harus diikuti
4. Level kompleksitas yang sesuai untuk mahasiswa
```

### When Reporting Issues:
```markdown
**Bug Report Format:**
1. Langkah reproduksi error
2. Expected vs actual behavior
3. Browser dan device yang digunakan
4. Error messages (jika ada)
5. Screenshots (jika UI related)
```

## 🔄 Version Control Guidelines

### Git Commit Messages (Indonesian):
- `feat: tambah fitur [nama fitur]`
- `fix: perbaiki bug pada [komponen]`
- `style: update styling untuk [halaman]`
- `docs: update dokumentasi`
- `refactor: refactor [komponen] untuk [alasan]`

### Branch Naming:
- `feature/nama-fitur`
- `bugfix/nama-bug`
- `hotfix/critical-issue`

## ⚠️ Critical Reminders

1. **SELALU** test pada mobile device view
2. **JANGAN** tambah dependencies tanpa persetujuan
3. **PASTIKAN** semua text dalam Bahasa Indonesia
4. **IKUTI** existing code style dan structure
5. **DOKUMENTASIKAN** setiap perubahan signifikan

---

**💡 Tip:** Copy dan paste guidelines ini setiap kali menggunakan AI assistant untuk consistency dan quality assurance.

**📅 Last Updated:** May 24, 2025  
**👨‍💻 Project Lead:** [Your Name]  
**📚 Course:** Pengembangan Aplikasi Web - Semester 4