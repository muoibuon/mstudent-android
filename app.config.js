// Bổ sung cấu hình phụ thuộc môi trường vào app.json.
//
//   GOOGLE_IOS_URL_SCHEME   = com.googleusercontent.apps.<IOS_CLIENT_ID đảo ngược>  → bật Google Sign-In trên iOS
//   MSTUDENT_HTTPS_ONLY=1   → cấm HTTP thường (dùng khi backend đã có HTTPS; khuyến nghị cho bản phát hành)
//   MSTUDENT_IOS_FREE_SIGNING=1 → build iOS ký bằng Apple ID miễn phí (Personal Team): Personal Team không có
//                             App Groups nên tắt share extension iOS. Vẫn dán thông báo được; Android không đổi.
//
// Mặc định cho phép HTTP trong MẠNG NỘI BỘ để điện thoại gọi backend chạy trên máy tính (http://192.168.x.x:8000).

module.exports = ({ config }) => {
  const httpsOnly = process.env.MSTUDENT_HTTPS_ONLY === '1';
  const freeIosSigning = process.env.MSTUDENT_IOS_FREE_SIGNING === '1';
  const plugins = (config.plugins ?? []).map((p) =>
    freeIosSigning && Array.isArray(p) && p[0] === 'expo-share-intent' ? [p[0], { ...p[1], disableIOS: true }] : p,
  );

  // Android: release build chặn HTTP thường trừ khi bật usesCleartextTraffic.
  // R8 (bản Release) xoá hàm khởi tạo của WorkDatabase_Impl mà WorkManager (expo-background-task) gọi bằng
  // reflection → crash ngay khi mở app (NoSuchMethodException: WorkDatabase_Impl.<init>). Giữ lại các lớp đó.
  const extraProguardRules = [
    '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
    '-keep class androidx.work.impl.** { *; }',
  ].join('\n');
  plugins.push(['expo-build-properties', { android: { usesCleartextTraffic: !httpsOnly, extraProguardRules } }]);

  // Google Sign-In gốc. Android không cần plugin (đăng ký SHA-1 trong Google Cloud Console là đủ).
  // iOS bắt buộc có URL scheme; chưa đặt biến môi trường thì bỏ qua plugin để build vẫn chạy
  // (khi đó nút "Tiếp tục với Google" trên iOS sẽ báo lỗi cấu hình).
  const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
  if (iosUrlScheme) plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);

  return {
    ...config,
    plugins,
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ...(httpsOnly
          ? {}
          : {
              // Chỉ nới ATS cho địa chỉ trong mạng nội bộ, không phải cho mọi tên miền.
              NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
              NSLocalNetworkUsageDescription:
                'MStudent kết nối tới máy chủ MStudent đang chạy trên máy tính trong cùng mạng Wi-Fi.',
            }),
      },
    },
  };
};
