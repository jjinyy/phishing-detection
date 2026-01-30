# 🚀 실행 방법 (Windows)

## 방법 1: 스크립트 사용 (가장 간단!)

### 백엔드 실행:
```powershell
.\start-backend.ps1
```

### 프론트엔드 실행 (새 터미널 창):
```powershell
.\start-frontend.ps1
```

## 방법 2: 수동 실행

### 1️⃣ 백엔드 실행

**PowerShell에서:**

```powershell
# 프로젝트 루트로 이동
cd C:\Users\Administrator\police

# 가상환경 생성 (처음 한 번만)
python -m venv venv

# 가상환경 활성화
.\venv\Scripts\Activate.ps1

# 의존성 설치 (처음 한 번만)
pip install -r requirements.txt

# .env 파일 생성 (없다면)
# 메모장으로 .env 파일을 만들고 아래 내용 추가:
# OPENAI_API_KEY=your_key_here
# FLASK_ENV=development
# FLASK_DEBUG=True
# PORT=5000

# 백엔드 서버 실행
cd backend
python run.py
```

✅ 백엔드가 `http://localhost:5000`에서 실행됩니다!

### 2️⃣ 프론트엔드 실행 (새 PowerShell 창)

```powershell
# 프로젝트 루트로 이동
cd C:\Users\Administrator\police

# frontend 디렉토리로 이동
cd frontend

# 의존성 설치 (처음 한 번만)
npm install

# React Native 서버 시작
npm start
```

### 3️⃣ 앱 실행

**Android:**
```powershell
npm run android
```

**또는 Expo Go 앱 사용:**
- `npm start` 실행 후 나타나는 QR 코드를 Expo Go 앱으로 스캔

## ⚠️ 문제 해결

### PowerShell 실행 정책 오류
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 포트 5000이 이미 사용 중
`.env` 파일에서 `PORT=5001`로 변경

### Python 모듈을 찾을 수 없음
```powershell
# 가상환경이 활성화되어 있는지 확인
# 프롬프트 앞에 (venv)가 보여야 합니다
```

### Node 모듈 오류
```powershell
cd frontend
rm -r node_modules
npm install
```

## 🧪 테스트

백엔드가 실행 중일 때:

**브라우저에서:**
- http://localhost:5000/health 접속

**PowerShell에서:**
```powershell
curl http://localhost:5000/health
```

## 📝 .env 파일 예시

프로젝트 루트에 `.env` 파일을 만들고:

```env
# OpenAI API Key (필수 - 테스트용으로는 없어도 모의 응답 사용)
OPENAI_API_KEY=sk-...

# Flask 설정
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

# 선택사항 (VoIP 통화 사용 시)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

**참고:** OpenAI API 키가 없어도 모의(mock) 응답으로 테스트할 수 있습니다!

