# Bàn giao: build và kiểm thử app Android (T032 phần Android)

> Dành cho thành viên đội (và coding agent của bạn: Claude Code / Codex). Đọc hết file này, `AGENTS.md`, `README.md`
> trước khi làm. Ngày bàn giao: 2026-11-13. **Demo: 2026-11-14.**

## 1. Bối cảnh trong 1 phút

- MStudent = AI inbox cho sinh viên: thông báo Gmail / LMS / Zalo → việc cần làm có hạn, ưu tiên, nhắc việc.
- Thang điểm: **demo AI trên điện thoại thật 40đ** (app native, đóng hẳn mở lại vẫn vào thẳng, AI gọi LLM thật),
  vấn đề thật 35đ, mở rộng 25đ. Demo trên trình duyệt / giả lập / Expo Go = **0 điểm tiêu chí 1**.
- Repo này chỉ có app Android. Backend, tài liệu chung và spec: https://github.com/muoibuon/mstudent-backend (nhánh `master`).
- **Backend production đã chạy**: `https://mstudent.tailec1929.ts.net` (Azure Japan East, Tailscale Funnel, HTTPS
  hợp lệ, chế độ `llm`: lọc bằng gemini-decision-1 khi có `GEMINI_API_KEY`, trả lời bằng gpt-6-luna). Kiểm tra: `curl https://mstudent.tailec1929.ts.net/api/health` → `"mode":"llm"`.
- iPhone do người khác build bằng Xcode. **Việc của bạn: Android.**

## 2. Việc cần làm

| # | Việc | Xong khi |
|---|---|---|
| A1 | Build APK bản **preview** (Release, chạy độc lập) trỏ tới production | Có link/ file `.apk` |
| A2 | Cài lên máy Android thật, chạy kiểm thử ở mục 5 **bằng 4G** (tắt Wi-Fi) | Mọi ô ở mục 5 đều ✓ |
| A3 | Gửi APK cho 5–10 bạn dùng thử (bằng chứng cho tiêu chí 2–3) | Họ đăng ký được, tạo được việc |
| A4 (tuỳ chọn) | Đăng nhập Google trên Android: đăng ký SHA-1 của khoá EAS trong Google Cloud | Nút "Tiếp tục với Google" chạy |

## 3. Chuẩn bị (một lần)

```bash
git clone https://github.com/muoibuon/mstudent-android.git
cd mstudent-android
npm install
npm test && npm run typecheck && npx expo lint   # phải xanh trước khi build
```

- Node ≥ 20. Tài khoản **Expo** miễn phí (expo.dev) → `npx eas-cli@latest login`.
- Lần build đầu EAS hỏi tạo project và **khoá ký Android** → chọn để EAS tự tạo và giữ (Yes). Đừng tự tạo keystore.
- Cần Wi-Fi: build chạy trên cloud của Expo (~10–20 phút, hàng đợi miễn phí có thể lâu hơn), tải APK ~60–90 MB.

## 4. Build

```bash
npx eas-cli@latest build --profile preview --platform android
```

- Địa chỉ server đã **gắn sẵn** trong `eas.json` (`build.preview.env.EXPO_PUBLIC_API_URL`), vì build trên cloud không đọc
  biến môi trường máy bạn. Không cần sửa gì.
- Xong sẽ có link tải APK và mã QR. Mở link trên điện thoại → tải → cho phép "cài ứng dụng không rõ nguồn".
- Bản `preview` vẫn cho `http://` tới địa chỉ mạng nội bộ (đường lui: laptop chạy backend qua hotspot). Bản
  `production` bật `MSTUDENT_HTTPS_ONLY=1`; chưa cần dùng cho demo.

**Build local (nếu EAS hàng đợi quá lâu)**: cần Android Studio + SDK + JDK 17.
```bash
EXPO_PUBLIC_API_URL=https://mstudent.tailec1929.ts.net npx expo run:android --variant release
```
Bản này ký bằng khoá debug: SHA-1 cho Google sẽ khác bản EAS (xem `docs/GOOGLE_CLOUD_SETUP.md`).

## 5. Kiểm thử trên máy thật (bằng 4G)

- [ ] Mở app → ô địa chỉ server đã điền sẵn `https://mstudent.tailec1929.ts.net` → **Đăng ký** tài khoản mới.
- [ ] Tab **Trợ lý** hiện **AI trực tiếp** và trả lời một câu hỏi nhập vào ô chat.
- [ ] Dán một thông báo, ví dụ `Nộp báo cáo Lab 4 môn Mạng trước 23h59 thứ 6 tuần sau` → ra việc đúng ngày giờ.
- [ ] Trợ lý: hỏi "tuần này có gì?" → trả lời đúng danh sách việc.
- [ ] Mở Zalo → giữ một tin → **Chia sẻ** → MStudent → ra việc.
- [ ] Bật **Nhắc việc trên máy** trong Cài đặt và cấp quyền thông báo. Thêm một việc có hạn gần, kiểm tra số thông báo đã hẹn tăng và thông báo hiện đúng hạn.
- [ ] **Đóng hẳn app** (vuốt khỏi đa nhiệm) → mở lại → vào thẳng, không hỏi đăng nhập. Làm 2 lần.
- [ ] Tắt mạng → app báo lỗi rõ ràng, không treo; bật lại → dùng tiếp.

Lỗi gặp phải: ghi lại bước, ảnh chụp màn hình, giờ xảy ra. **Không** dán token, mật khẩu, khoá vào báo cáo.

## 6. Quy tắc khi sửa code mobile (tóm tắt `AGENTS.md`)

- Cài gói bằng `npx expo install …`; đọc docs Expo **SDK 58** trước khi dùng API mới.
- Không sửa tay và không commit `android/`, `ios/` (sinh bởi `expo prebuild`).
- Logic thuần đặt trong `lib/` và có test (`lib/__tests__/`). Chữ hiển thị tiếng Việt; tên biến/commit tiếng Anh.
- Không đưa bất kỳ khoá bí mật nào vào `` (khoá OpenAI chỉ nằm trên server).
- `lib/url.ts` chỉ cho `http://` với địa chỉ mạng nội bộ — đừng nới lỏng.
- Chạy `npm test && npm run typecheck && npx expo lint` trước khi commit. Mỗi PR một việc, vào nhánh riêng từ
  `dev`, ví dụ `android-build-fixes`.

## 7. Những gì bạn KHÔNG cần và KHÔNG được xin

- Khoá OpenAI, khoá SSH của máy chủ, file `/etc/mstudent.env`: không cần cho Android. Backend đã chạy sẵn.
- Quyền admin web console: nếu cần xem thẻ **📊 Số liệu**, báo trưởng nhóm email của bạn để được thêm vào
  `MSTUDENT_ADMIN_EMAILS`, rồi **đăng ký ngay** bằng email đó.

## 8. Tham khảo

| File | Nội dung |
|---|---|
| `README.md` | Cấu trúc app, các cách chạy (Expo Go / dev build / Release) |
| `docs/DEMO_RUNBOOK.md` | Mục Production, kịch bản 3 phút, xử lý sự cố |
| `docs/GOOGLE_CLOUD_SETUP.md` | SHA-1 Android, test user Gmail |
| `docs/SECURITY.md` | Biện pháp bảo mật đã làm / chưa làm |
| `specs/` (repo backend) | Tiến độ; T032 là việc build app |

## 9. Báo lại cho trưởng nhóm

1. Link APK (hoặc file). 2. Kết quả mục 5 (✓/✗ từng ô). 3. Model máy + phiên bản Android. 4. Số bạn đã cài thử (A3).
