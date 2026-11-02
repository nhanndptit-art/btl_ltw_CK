# THEME GUIDELINES — PROJECT: NEURAL OVERDRIVE (CYBERPUNK ANIME GACHA)

## 1. Triết lý Thiết kế & Định hướng Thị giác (Aesthetic Direction)
Dự án mang phong cách **Industrial Cyberpunk & Tactical Telemetry** — kết hợp giữa giao diện máy đầu cuối quân sự ngầm (underground neural terminal) và thẩm mỹ sắc lẹm của các tựa game Sci-Fi RPG hiện đại.
- **Từ khóa chủ đạo:** Sắc cạnh (Chamfered edges), Tương phản cực đại (High-contrast), Đèn huỳnh quang điện tử (Acid/Neon Accents), Bất đối xứng có chủ đích.
- **Nguyên tắc cốt lõi:**
  1. **Không dùng bo góc mềm mại kiểu SaaS:** Thay thế hoàn toàn `border-radius: 12px` bằng góc vát 45 độ (`clip-path: polygon(...)`) hoặc góc vuông sắc cạnh (`0px` - `2px`) đi kèm đường viền kỹ thuật `1px solid`.
  2. **Cấu trúc là thông tin:** Mọi đường kẻ, mã số định danh (`UNIT // 09`), thanh đo Pity (`PITY TELEMETRY`) đều đóng vai trò hiển thị dữ liệu thực tế của hệ thống Gacha.
  3. **Điểm nhấn chuyển động có kiểm soát:** Giữ giao diện tĩnh, kỷ luật ở trạng thái nghỉ; dồn toàn bộ hiệu ứng ánh sáng/chuyển động vào khoảnh khắc **Triệu hồi thẻ bài (Gacha Reveal)** và phản hồi khi tương tác nút bấm.

---

## 2. Hệ thống Màu sắc (Color Palette — HEX & RGB)

Hệ thống hỗ trợ 2 chế độ giao diện thông qua `ThemeContext`: **Dark Mode (Night City Overdrive - Mặc định)** và **Light Mode (Whiteout Lab - Phòng thí nghiệm Quang học)**.

### 2.1. Bảng màu Nền & Bề mặt (Background & Surface)
| Token CSS | Vai trò | Dark Mode (HEX / RGB) | Light Mode (HEX / RGB) |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | Nền chính toàn trang | `#08090C` / `rgb(8, 9, 12)` | `#ECEFF4` / `rgb(236, 239, 244)` |
| `--bg-secondary` | Nền khu vực / Panel | `#11131A` / `rgb(17, 19, 26)` | `#FFFFFF` / `rgb(255, 255, 255)` |
| `--bg-surface` | Nền thẻ bài / Hộp thoại | `#181B24` / `rgb(24, 27, 36)` | `#E2E6F0` / `rgb(226, 230, 240)` |
| `--border-dim` | Viền cấu trúc tiêu chuẩn | `#262B38` / `rgb(38, 43, 56)` | `#C5CCD9` / `rgb(197, 204, 217)` |

### 2.2. Bảng màu Chữ (Typography Colors)
| Token CSS | Vai trò | Dark Mode (HEX / RGB) | Light Mode (HEX / RGB) |
| :--- | :--- | :--- | :--- |
| `--text-primary` | Tiêu đề & Nội dung chính | `#F3F5F8` / `rgb(243, 245, 248)` | `#0D1017` / `rgb(13, 16, 23)` |
| `--text-secondary` | Mô tả phụ, nhãn thông số | `#8A94A6` / `rgb(138, 148, 166)` | `#4A5365` / `rgb(74, 83, 101)` |
| `--text-muted` | Chữ chìm, chỉ số phụ | `#525B6C` / `rgb(82, 91, 108)` | `#7B8496` / `rgb(123, 132, 150)` |

### 2.3. Bảng màu Điểm nhấn Neon (Brand & Action Accents)
| Token CSS | Vai trò | Mã HEX | Mã RGB |
| :--- | :--- | :--- | :--- |
| `--accent-primary` | Vàng Axit (Nút Roll x10, CTA chính) | `#E6FF00` | `rgb(230, 255, 0)` |
| `--accent-secondary` | Hồng Điện Tử (Cảnh báo, Pity, Roll x1) | `#FF0055` | `rgb(255, 0, 85)` |
| `--accent-cyber` | Xanh Cyan (Trạng thái Active, Link) | `#00F0FF` | `rgb(0, 240, 255)` |

### 2.4. Bảng màu Độ hiếm Thẻ bài (Rarity Color Tokens)
| Độ hiếm (Rarity) | Tỷ lệ gốc | Tên màu | Mã HEX | Mã RGB |
| :--- | :--- | :--- | :--- | :--- |
| **COMMON** | 60.0% | Chrome Slate | `#7F8C9A` | `rgb(127, 140, 154)` |
| **RARE** | 30.0% | Cyber Cyan | `#00F0FF` | `rgb(0, 240, 255)` |
| **EPIC** | 8.5% | Neon Magenta | `#D900FF` | `rgb(217, 0, 255)` |
| **LEGENDARY** | 1.5% | Solar Overdrive Gold | `#FFB800` | `rgb(255, 184, 0)` |

---

## 3. Hệ thống Chữ viết (Typography)
Nhúng từ Google Fonts trong `index.html`:
- **Display / Heading (`--font-display`):** `'Chakra Petch', sans-serif` (Weights: 600, 700). Tạo nét cơ khí, góc cạnh đặc trưng cho tên Banner, tên Nhân vật và nút Gacha.
- **Body / UI (`--font-body`):** `'Plus Jakarta Sans', sans-serif` (Weights: 400, 500, 600). Đảm bảo độ rõ nét cao khi đọc mô tả kỹ năng và giao diện điều hướng.
- **Telemetry / Số liệu (`--font-mono`):** `'JetBrains Mono', monospace` (Weights: 500, 700). Bắt buộc dùng cho số dư Gem, bộ đếm bảo hiểm (`Pity: 85/90`), tỷ lệ rớt thẻ và chỉ số ATK/DEF.

---

## 4. Bố cục & Quy chuẩn Chuẩn bị Hình ảnh (Asset Guidelines)

### 4.1. Sơ đồ Bố cục Trang Gacha (ASCII Layout Wireframe)
```text
+-----------------------------------------------------------------------+
| [LOGO: NEURAL//GACHA]    [NavLink: Triệu Hồi] [NavLink: Kho Đồ] [Gem] |
+-----------------------------------------------------------------------+
| +-----------------------------------+ +-----------------------------+ |
| | BANNER VISUAL & TELEMETRY         | | PITY PROGRESS: [85 / 90]    | |
| |                                   | | [===================>     ] | |
| | NIGHT CITY // OVERDRIVE           | |                             | |
| | Rate-Up: AKIRA - ZERO             | | [ QUAY x1  (160 GEMS)     ] | |
| |                                   | | [ QUAY x10 (1600 GEMS)    ] | |
| +-----------------------------------+ +-----------------------------+ |
| +-------------------------------------------------------------------+ |
| | KẾT QUẢ TRIỆU HỒI (1 HOẶC 10 THẺ - GRID 5 CỘT)                    | |
| | [ CARD 01 ]  [ CARD 02 ]  [ CARD 03 ]  [ CARD 04 ]  [ CARD 05 ]   | |
| +-------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+