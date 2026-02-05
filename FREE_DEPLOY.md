# 완전 무료 배포 가이드 (비용 0원)

Railway는 무료 크레딧이 제한적이라 걱정되시나요? 완전 무료로 배포할 수 있는 방법들을 정리했습니다.

## 추천: Render (완전 무료)

Render는 **월 750시간 무료**를 제공합니다. 하루 24시간 켜둬도 한 달에 30일이면 720시간이므로 **완전 무료**로 사용 가능합니다!

### 백엔드 배포 (Render)

1. **Render 가입**
   - https://render.com 접속
   - "Get Started for Free" 클릭
   - GitHub로 로그인

2. **새 Web Service 생성**
   - Dashboard → "New +" → "Web Service"
   - GitHub 저장소 연결: `jjinyy/phishing-detection` 선택

3. **설정 입력**
   ```
   Name: police-backend
   Environment: Python 3
   Region: Singapore (또는 가장 가까운 지역)
   Branch: main
   Root Directory: (비워두기)
   Build Command: pip install -r requirements.txt
   Start Command: cd backend && python run.py
   ```

4. **환경 변수 추가**
   - Environment Variables 섹션에서:
     ```
     OPENAI_API_KEY = your_openai_api_key
     FLASK_ENV = production
     ```
   - PORT는 Render가 자동으로 설정 (5000 사용)

5. **배포 시작**
   - "Create Web Service" 클릭
   - 배포 완료까지 5-10분 소요
   - 배포 완료 후 URL 확인 (예: `https://police-backend.onrender.com`)

6. **무료 플랜 설정 확인**
   - Settings → Plan
   - "Free" 플랜이 선택되어 있는지 확인
   - 무료 플랜은 15분 동안 요청이 없으면 자동으로 sleep됨 (첫 요청 시 깨어남)

### 프론트엔드 배포 (GitHub Pages - 완전 무료)

1. **프론트엔드 코드 수정**
   - `frontend/app-full.js` 파일 열기
   - `getApiBaseUrl()` 함수 수정:
   ```javascript
   const getApiBaseUrl = () => {
     const hostname = window.location.hostname;
     
     // 프로덕션 환경: Render 백엔드 URL 사용
     if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
       return 'https://police-backend.onrender.com/api';  // Render URL 입력
     }
     
     // 로컬 개발 환경
     return 'http://localhost:5000/api';
   };
   ```

2. **GitHub에 푸시**
   ```bash
   git add frontend/app-full.js
   git commit -m "Render 백엔드 URL 설정"
   git push origin main
   ```

3. **GitHub Pages 활성화**
   - GitHub 저장소 → Settings → Pages
   - Source: `main` 브랜치
   - Folder: `/frontend`
   - Save 클릭

4. **완료!**
   - 몇 분 후 `https://jjinyy.github.io/phishing-detection` 접속 가능

## 대안 1: Fly.io (완전 무료)

Fly.io도 무료 티어를 제공합니다.

### Fly.io 배포

1. **Fly.io 가입**
   - https://fly.io 접속
   - "Sign Up" 클릭

2. **Fly CLI 설치**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

3. **로그인**
   ```bash
   fly auth login
   ```

4. **앱 초기화**
   ```bash
   cd backend
   fly launch
   ```
   - 앱 이름 입력
   - 지역 선택 (가장 가까운 곳)
   - PostgreSQL 필요 없음 (No)

5. **환경 변수 설정**
   ```bash
   fly secrets set OPENAI_API_KEY=your_openai_api_key
   fly secrets set FLASK_ENV=production
   ```

6. **배포**
   ```bash
   fly deploy
   ```

7. **URL 확인**
   ```bash
   fly open
   ```

## 대안 2: PythonAnywhere (완전 무료)

PythonAnywhere는 Python 웹앱을 위한 무료 호스팅 서비스입니다.

1. **PythonAnywhere 가입**
   - https://www.pythonanywhere.com 접속
   - "Beginner" 플랜 선택 (무료)

2. **Files 탭에서 코드 업로드**
   - GitHub에서 코드 클론
   - 또는 직접 파일 업로드

3. **Web 앱 생성**
   - Web 탭 → "Add a new web app"
   - Flask 선택
   - Python 버전 선택

4. **WSGI 파일 수정**
   - Web 탭 → WSGI configuration file
   - 경로를 프로젝트에 맞게 수정

5. **환경 변수 설정**
   - Files 탭 → `.env` 파일 생성
   - API 키 입력

6. **Reload 클릭**
   - Web 탭 → Reload 버튼

## 무료 서비스 비교

| 서비스 | 무료 제공량 | 제한사항 |
|--------|------------|---------|
| **Render** | 월 750시간 | 15분 비활성 시 sleep (첫 요청 시 깨어남) |
| **Fly.io** | 3개 앱, 월 3GB | 트래픽 제한 있음 |
| **PythonAnywhere** | 1개 웹앱 | 외부 API 호출 제한, 하루 1회 재시작 필요 |
| **Railway** | $5 크레딧/월 | 크레딧 소진 시 유료 |

## 추천 순서

1. **Render** (가장 추천) - 설정 간단, 안정적
2. **Fly.io** - 빠르고 현대적
3. **PythonAnywhere** - Python 전용, 설정 복잡

## Render Sleep 문제 해결

Render 무료 플랜은 15분 비활성 시 sleep됩니다. 해결 방법:

1. **Uptime Robot 사용** (무료)
   - https://uptimerobot.com 가입
   - Monitor 추가
   - URL: `https://police-backend.onrender.com/health`
   - Interval: 5분
   - 이렇게 하면 5분마다 핑을 보내서 sleep 방지

2. **코드에 헬스체크 추가** (이미 있음)
   - `/health` 엔드포인트가 이미 구현되어 있음
   - Uptime Robot이 이걸 호출하면 됨

## 비용 정리

- **Render**: 완전 무료 (월 750시간)
- **GitHub Pages**: 완전 무료 (무제한)
- **Uptime Robot**: 완전 무료 (50개 모니터)
- **총 비용: 0원**

## 다음 단계

1. Render에 백엔드 배포
2. GitHub Pages에 프론트엔드 배포
3. Uptime Robot으로 sleep 방지 (선택사항)
4. 완료!

