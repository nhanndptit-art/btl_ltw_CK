# Hướng dẫn chạy dự án

Dự án gồm:

- `backend`: API Express.js và kết nối MySQL.
- `frontend`: giao diện React chạy bằng Vite.

## Yêu cầu môi trường

- Node.js 18 trở lên và npm.
- MySQL 8 trở lên (hoặc một máy chủ MySQL tương thích).
- Git.

Kiểm tra phiên bản:

```bash
node --version
npm --version
mysql --version
```

## 1. Clone dự án

```bash
git clone <https://github.com/nhanndptit-art/btl_ltw_CK>
cd webCK
```

## 2. Cài đặt và khởi tạo database

Tạo database, bảng và dữ liệu mẫu bằng file `database.sql`:

```bash
mysql -u root -p < database.sql
```

Nếu dùng Windows PowerShell và lệnh chuyển hướng ở trên không hoạt động, chạy:

```powershell
Get-Content .\database.sql | mysql -u root -p
```

## 3. Cấu hình backend

Mở terminal tại thư mục gốc:

```bash
copy backend\.env.example backend\.env
```

Trong macOS/Linux, dùng:

```bash
cp backend/.env.example backend/.env
```

Điền thông tin MySQL thật vào `backend/.env`. Không đưa file này lên Git.

Cài thư viện và chạy backend:

```bash
cd backend
npm install
npm run dev
```

Backend chạy mặc định tại `http://localhost:5000`. Kiểm tra nhanh bằng:

```bash
curl http://localhost:5000/api/health
```

Có thể dùng `npm start` thay cho `npm run dev` để chạy không bật chế độ tự khởi động lại.

## 4. Cấu hình và chạy frontend

Mở terminal thứ hai tại thư mục gốc:

```bash
copy frontend\.env.example frontend\.env
```

Trong macOS/Linux, dùng:

```bash
cp frontend/.env.example frontend/.env
```

Cài thư viện và chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173`.

## Lệnh build production

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

Backend:

```bash
cd backend
npm start
```

## Thông tin tài khoản mẫu

Database mẫu tạo sẵn tài khoản:

- Username: `cyber_runner`
- Password: `123456`
