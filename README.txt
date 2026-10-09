하루 발자취 (안드로이드 앱) — 만드는 방법
==========================================
컴퓨터에 Android Studio를 깔 필요 없이, GitHub의 무료 자동 빌드로 APK 파일을 만듭니다.

[1단계] GitHub에 올리기 (휴대폰에서 하는 방법)
1. 이 zip 파일을 「내 파일」 앱에서 길게 눌러 압축을 풉니다.
2. GitHub 화면 위쪽 + ▾ > New repository > 이름에 hanuru > Private > Create repository
3. 새 저장소 화면에서 「uploading an existing file」 링크를 눌러, 압축 푼 파일을 모두 선택해 올리고 Commit changes
   (build-apk.yml 은 올리지 않아도 됩니다. 다음 단계에서 따로 넣어요.)
4. Add file > Create new file 을 누르고, 이름 칸에 .github/workflows/build-apk.yml 을 입력합니다.
   (슬래시 / 를 입력하면 폴더가 만들어져요.) 내용 칸에 build-apk.yml 내용을 붙여 넣고 Commit changes.
   이 저장이 끝나면 APK 만들기가 자동으로 시작됩니다.

[2단계] APK 만들기 (약 5~10분)
1. 저장소 위쪽 Actions 탭 > 왼쪽 「APK 만들기」 > Run workflow 를 누릅니다.
   (파일을 올리면 자동으로 시작되기도 합니다.)
2. 초록색 체크가 뜨면 그 실행을 눌러 맨 아래 Artifacts 의 hanuru-apk 를 내려받습니다. (zip 파일)
3. 압축을 풀면 app-debug.apk 가 나옵니다.
   (빨간 X가 뜨면 실행 화면의 오류 부분 사진을 보내 주세요. 고쳐 드릴게요.)

[3단계] 폰에 설치
1. app-debug.apk 를 폰으로 옮겨 누릅니다. (내 파일 앱)
2. 「출처를 알 수 없는 앱 설치」를 한 번 허용하고 설치합니다. 「Play 프로텍트」 경고가 나오면 「그래도 설치」를 누릅니다.
3. 앱을 열고 「기록 시작」 > 위치 권한 허용, 알림 허용.
4. 기록이 끊기지 않게 폰 설정을 한 번 바꿔 주세요.
   설정 > 앱 > 하루 발자취 > 배터리 > 「제한 없음」(삼성은 「제한 없음」 또는 「절전 모드에서 제외」)

[클라우드 저장 (선택)]
- 기록은 폰에 먼저 저장됩니다. 기기 간 동기화를 쓰려면 www/config.js 에 Firebase 설정값을 넣으세요.
- Firebase 콘솔에서 Authentication > 로그인 방법 > 「이메일/비밀번호」 사용 설정
  (앱에서는 구글 로그인 대신 이메일/비밀번호로 로그인합니다. 앱 첫 화면의 로그인 버튼 > 「처음이면 가입」)
- Firestore 규칙은 웹앱 설명서와 같습니다:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}

- 웹앱(브라우저 버전)은 구글 로그인, 이 앱은 이메일 로그인이라 계정이 달라 기록이 서로 이어지지 않을 수 있습니다.
  앱을 주로 쓰시길 권합니다.

[참고]
- 화면을 꺼도, 다른 앱을 써도 기록됩니다. 기록 중에는 알림창에 「하루 발자취」가 떠 있습니다.
- 지도는 인터넷이 있을 때만 보입니다. 기록 자체는 인터넷이 없어도 저장됩니다.
- PNG는 「PNG 저장·공유」를 누르면 공유 창이 뜨고, 여기서 갤러리·인스타그램 등으로 보냅니다.
- 안드로이드 12 이상에서 앱을 강제 종료하면 기록이 멈춥니다.

제작자 인스타 @greada_2
