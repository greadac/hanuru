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

// 3) 매번 같은 서명 키를 쓰게 해서, 새 APK를 지우지 않고 덮어 설치할 수 있게 합니다.
const os = require('os');
if (fs.existsSync('debug.keystore')) {
  const dir = path.join(os.homedir(), '.android');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync('debug.keystore', path.join(dir, 'debug.keystore'));
  console.log('서명 키 적용 완료');
}

// 4) 앱을 밀어서 닫아도 계속 기록하는 네이티브 위치 서비스
const javaDir = path.join('android','app','src','main','java','com','greada','hanuru');
fs.mkdirSync(javaDir, { recursive: true });
fs.writeFileSync(path.join(javaDir,'TrackService.java'), "package com.greada.hanuru;\n\nimport android.app.Notification;\nimport android.app.NotificationChannel;\nimport android.app.NotificationManager;\nimport android.app.PendingIntent;\nimport android.app.Service;\nimport android.content.Context;\nimport android.content.Intent;\nimport android.content.SharedPreferences;\nimport android.content.pm.ServiceInfo;\nimport android.location.Location;\nimport android.location.LocationListener;\nimport android.location.LocationManager;\nimport android.os.Build;\nimport android.os.Bundle;\nimport android.os.IBinder;\n\nimport java.io.File;\nimport java.io.FileOutputStream;\nimport java.io.FileInputStream;\nimport java.io.ByteArrayOutputStream;\nimport java.nio.charset.StandardCharsets;\n\n/** \uc571 \ud654\uba74(WebView)\uacfc \uc0c1\uad00\uc5c6\uc774 \uc704\uce58\ub97c \ud30c\uc77c\uc5d0 \uc313\ub294 \ud3ec\uadf8\ub77c\uc6b4\ub4dc \uc11c\ube44\uc2a4 */\npublic class TrackService extends Service implements LocationListener {\n    static final String PREFS = \"hanuru_track\";\n    static final String CH = \"hanuru_track_ch\";\n    static final Object LOCK = new Object();\n    private LocationManager lm;\n\n    static File logFile(Context c) { return new File(c.getFilesDir(), \"track.log\"); }\n\n    static boolean isRecording(Context c) {\n        return c.getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(\"rec\", false);\n    }\n\n    static void setRecording(Context c, boolean v) {\n        c.getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(\"rec\", v).apply();\n    }\n\n    /** \uc313\uc778 \uc810\uc744 \ud55c \ubc88\uc5d0 \uaebc\ub0b4\uace0 \ud30c\uc77c\uc744 \ube44\uc6c1\ub2c8\ub2e4. \uc904\ub9c8\ub2e4 \"\uc704\ub3c4,\uacbd\ub3c4,\uc815\ud655\ub3c4,\uc2dc\uac01\" */\n    static String drain(Context c) {\n        synchronized (LOCK) {\n            File f = logFile(c);\n            if (!f.exists() || f.length() == 0) return \"\";\n            try {\n                FileInputStream in = new FileInputStream(f);\n                ByteArrayOutputStream out = new ByteArrayOutputStream();\n                byte[] buf = new byte[8192];\n                int n;\n                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);\n                in.close();\n                String s = new String(out.toByteArray(), StandardCharsets.UTF_8);\n                f.delete();\n                return s;\n            } catch (Exception e) {\n                return \"\";\n            }\n        }\n    }\n\n    @Override\n    public int onStartCommand(Intent intent, int flags, int startId) {\n        createChannel();\n        Notification n = buildNotification();\n        if (Build.VERSION.SDK_INT >= 29) {\n            startForeground(7311, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);\n        } else {\n            startForeground(7311, n);\n        }\n        setRecording(this, true);\n        if (lm == null) {\n            lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);\n            try {\n                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 4000L, 6f, this);\n            } catch (SecurityException e) {\n                stopSelf();\n            } catch (Exception e) {\n                // GPS \uc7a5\uce58\uac00 \uc5c6\ub294 \uacbd\uc6b0 \ub4f1\n            }\n        }\n        return START_STICKY;\n    }\n\n    private void createChannel() {\n        if (Build.VERSION.SDK_INT >= 26) {\n            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);\n            NotificationChannel ch = new NotificationChannel(CH, \"\uc774\ub3d9 \uacbd\ub85c \uae30\ub85d\", NotificationManager.IMPORTANCE_LOW);\n            nm.createNotificationChannel(ch);\n        }\n    }\n\n    private Notification buildNotification() {\n        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());\n        int fl = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;\n        PendingIntent pi = PendingIntent.getActivity(this, 0, open, fl);\n        Notification.Builder b = Build.VERSION.SDK_INT >= 26\n                ? new Notification.Builder(this, CH) : new Notification.Builder(this);\n        b.setContentTitle(\"\ud558\ub8e8 \ubc1c\uc790\ucde8\")\n                .setContentText(\"\uc774\ub3d9 \uacbd\ub85c\ub97c \uae30\ub85d\ud558\uace0 \uc788\uc5b4\uc694\")\n                .setSmallIcon(R.drawable.ic_tracking)\n                .setOngoing(true)\n                .setContentIntent(pi);\n        return b.build();\n    }\n\n    @Override\n    public void onLocationChanged(Location l) {\n        if (l == null || l.hasAccuracy() && l.getAccuracy() > 60f) return;\n        String line = l.getLatitude() + \",\" + l.getLongitude() + \",\"\n                + (l.hasAccuracy() ? Math.round(l.getAccuracy()) : 10) + \",\"\n                + l.getTime() + \"\\n\";\n        synchronized (LOCK) {\n            try {\n                FileOutputStream o = new FileOutputStream(logFile(this), true);\n                o.write(line.getBytes(StandardCharsets.UTF_8));\n                o.close();\n            } catch (Exception e) {\n                // \uc800\uc7a5 \uc2e4\ud328\ub294 \uac74\ub108\ub700\n            }\n        }\n    }\n\n    @Override public void onStatusChanged(String p, int s, Bundle e) {}\n    @Override public void onProviderEnabled(String p) {}\n    @Override public void onProviderDisabled(String p) {}\n\n    @Override\n    public void onDestroy() {\n        try { if (lm != null) lm.removeUpdates(this); } catch (Exception e) {}\n        lm = null;\n        super.onDestroy();\n    }\n\n    @Override public IBinder onBind(Intent i) { return null; }\n}\n");
fs.writeFileSync(path.join(javaDir,'TrackerPlugin.java'), "package com.greada.hanuru;\n\nimport android.Manifest;\nimport android.content.Context;\nimport android.content.Intent;\nimport android.os.Build;\n\nimport androidx.core.content.ContextCompat;\n\nimport com.getcapacitor.JSObject;\nimport com.getcapacitor.PermissionState;\nimport com.getcapacitor.Plugin;\nimport com.getcapacitor.PluginCall;\nimport com.getcapacitor.PluginMethod;\nimport com.getcapacitor.annotation.CapacitorPlugin;\nimport com.getcapacitor.annotation.Permission;\nimport com.getcapacitor.annotation.PermissionCallback;\n\n@CapacitorPlugin(\n    name = \"HanuruTracker\",\n    permissions = {\n        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, alias = \"location\"),\n        @Permission(strings = {\"android.permission.POST_NOTIFICATIONS\"}, alias = \"notif\")\n    }\n)\npublic class TrackerPlugin extends Plugin {\n\n    @PluginMethod\n    public void start(PluginCall call) {\n        if (getPermissionState(\"location\") != PermissionState.GRANTED) {\n            requestPermissionForAlias(\"location\", call, \"locCb\");\n            return;\n        }\n        afterLocation(call);\n    }\n\n    @PermissionCallback\n    private void locCb(PluginCall call) {\n        if (getPermissionState(\"location\") == PermissionState.GRANTED) {\n            afterLocation(call);\n        } else {\n            call.reject(\"NOT_AUTHORIZED\");\n        }\n    }\n\n    private void afterLocation(PluginCall call) {\n        if (Build.VERSION.SDK_INT >= 33 && getPermissionState(\"notif\") != PermissionState.GRANTED) {\n            requestPermissionForAlias(\"notif\", call, \"notifCb\");\n            return;\n        }\n        go(call);\n    }\n\n    @PermissionCallback\n    private void notifCb(PluginCall call) {\n        go(call);\n    }\n\n    private void go(PluginCall call) {\n        try {\n            Context c = getContext();\n            ContextCompat.startForegroundService(c, new Intent(c, TrackService.class));\n            call.resolve();\n        } catch (Exception e) {\n            call.reject(\"START_FAILED: \" + e.getMessage());\n        }\n    }\n\n    @PluginMethod\n    public void stop(PluginCall call) {\n        Context c = getContext();\n        TrackService.setRecording(c, false);\n        c.stopService(new Intent(c, TrackService.class));\n        call.resolve();\n    }\n\n    @PluginMethod\n    public void status(PluginCall call) {\n        JSObject r = new JSObject();\n        r.put(\"recording\", TrackService.isRecording(getContext()));\n        call.resolve(r);\n    }\n\n    @PluginMethod\n    public void drain(PluginCall call) {\n        JSObject r = new JSObject();\n        r.put(\"data\", TrackService.drain(getContext()));\n        call.resolve(r);\n    }\n}\n");
fs.writeFileSync(path.join(javaDir,'MainActivity.java'),
`package com.greada.hanuru;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TrackerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);

// 5) 매니페스트: 서비스와 권한 등록
const mf = path.join('android','app','src','main','AndroidManifest.xml');
let m = fs.readFileSync(mf,'utf8');
if (!m.includes('TrackService')) {
  m = m.replace('</application>',
    '    <service android:name=".TrackService" android:exported="false" android:foregroundServiceType="location" />\n    </application>');
  const perms = ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','FOREGROUND_SERVICE','FOREGROUND_SERVICE_LOCATION','POST_NOTIFICATIONS','WAKE_LOCK']
    .filter(p => !m.includes('android.permission.'+p + '"'))
    .map(p => '    <uses-permission android:name="android.permission.'+p+'" />\n').join('');
  m = m.replace('</manifest>', perms + '</manifest>');
  fs.writeFileSync(mf, m);
  console.log('매니페스트 수정 완료');
}
console.log('안드로이드 설정 완료');
