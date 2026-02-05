# 빠른 배포 가이드 (5분 안에)

## 가장 간단한 방법: GitHub Pages + Render (완전 무료!)

> ⚠️ Railway는 무료 크레딧이 제한적입니다. 완전 무료를 원하시면 **Render**를 사용하세요!
> 
> - **Render**: 월 750시간 무료 (하루 24시간 켜둬도 무료)
> - **Railway**: 월 $5 크레딧 (소진 시 유료)

## 방법 1: Render 사용 (추천 - 완전 무료)

### 1단계: 백엔드 배포 (Render) - 5분

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
   Build Command: pip install -r requirements.txt
   Start Command: cd backend && python run.py
   ```

4. **환경 변수 추가**
   - Environment Variables 섹션:
     ```
     OPENAI_API_KEY = your_openai_api_key_here
     FLASK_ENV = production
     ```
   - PORT는 Render가 자동 설정

5. **배포 시작**
   - "Create Web Service" 클릭
   - 배포 완료까지 5-10분 소요
   - 배포 완료 후 URL 확인 (예: `https://police-backend.onrender.com`)
   - 이 URL을 메모해두세요!

6. **무료 플랜 확인**
   - Settings → Plan
   - "Free" 플랜 선택 확인
   - ⚠️ 무료 플랜은 15분 비활성 시 sleep됨 (첫 요청 시 자동 깨어남)

### 2단계: 프론트엔드 배포 (GitHub Pages) - 2분

1. **프론트엔드 코드 수정**
   - `frontend/app-full.js` 파일 열기
   - 20번째 줄 근처의 `getApiBaseUrl()` 함수 찾기
   - 주석 처리된 부분을 해제하고 백엔드 URL 입력:
   ```javascript
   if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
     return 'https://police-backend.onrender.com/api';  // Render URL 입력
   }
   ```

2. **GitHub에 푸시**
   ```bash
   git add frontend/app-full.js
   git commit -m "배포 준비: 백엔드 URL 설정"
   git push origin main
   ```

3. **GitHub Pages 활성화**
   - GitHub 저장소 페이지로 이동
   - Settings → Pages
   - Source: `main` 브랜치 선택
   - Folder: `/frontend` 선택
   - Save 클릭

4. **배포 완료!**
   - 몇 분 후 `https://jjinyy.github.io/phishing-detection` 접속 가능
   - (또는 GitHub에서 제공하는 다른 URL)

## 대안: Netlify 사용 (더 간단)

### 프론트엔드만 Netlify에 배포

1. **Netlify 가입**
   - https://netlify.com 접속
   - "Add new site" → "Import an existing project"

2. **GitHub 연결**
   - 저장소 선택
   - Build settings:
     - Base directory: `frontend`
     - Publish directory: `frontend`
   - "Deploy site" 클릭

3. **환경 변수 설정 (선택사항)**
   - Site settings → Environment variables
   - `REACT_APP_API_URL` = `https://police-backend.onrender.com/api`

4. **완료!**
   - Netlify가 자동으로 URL 생성 (예: `https://police-app.netlify.app`)

## 문제 해결

### 백엔드 연결 안 될 때
- Render 대시보드에서 서버가 실행 중인지 확인
- 로그 확인 (Render → Logs 탭)
- 환경 변수가 올바르게 설정되었는지 확인
- Render 무료 플랜은 15분 비활성 시 sleep되므로 첫 요청이 느릴 수 있음 (정상)

### CORS 에러 발생 시
- 백엔드 `backend/app.py`의 CORS 설정 확인
- 현재는 모든 origin 허용 (`"origins": "*"`)이므로 문제없어야 함

### 프론트엔드가 백엔드를 찾지 못할 때
- 브라우저 개발자 도구(F12) → Network 탭 확인
- API 호출이 실패하는지 확인
- `app-full.js`의 백엔드 URL이 올바른지 확인

## 비용

- **GitHub Pages**: 완전 무료 (무제한)
- **Render**: 완전 무료 (월 750시간 - 하루 24시간 켜둬도 무료!)
- **Netlify**: 완전 무료 (100GB/월)

> 💡 **총 비용: 0원!** Render는 월 750시간을 무료로 제공하므로 하루 24시간 켜둬도 한 달에 720시간이므로 완전 무료입니다.

## 다음 단계

배포 후:
1. 실제 도메인 연결 (선택사항)
2. HTTPS 자동 설정됨 (모든 서비스가 자동 제공)
3. 자동 배포 설정 (GitHub에 푸시하면 자동 업데이트)

