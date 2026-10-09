// 자동 빌드 중에 안드로이드 프로젝트에 알림 문구와 아이콘을 넣습니다.
const fs = require('fs');
const path = require('path');
const res = path.join('android', 'app', 'src', 'main', 'res');

// 1) 알림 아이콘 (흰색 위치 핀)
fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
fs.writeFileSync(path.join(res, 'drawable', 'ic_tracking.xml'),
`<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp"
    android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFF"
      android:pathData="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"/>
</vector>
`);

// 2) 알림 채널 이름 / 아이콘 / 색
const f = path.join(res, 'values', 'strings.xml');
let x = fs.readFileSync(f, 'utf8');
const add =
`    <string name="capacitor_background_geolocation_notification_channel_name">이동 경로 기록</string>
    <string name="capacitor_background_geolocation_notification_icon">drawable/ic_tracking</string>
    <string name="capacitor_background_geolocation_notification_color">#1f4fe0</string>
`;
if (!x.includes('capacitor_background_geolocation_notification_channel_name')) {
  x = x.replace('</resources>', add + '</resources>');
  fs.writeFileSync(f, x);
}
console.log('안드로이드 설정 완료');
