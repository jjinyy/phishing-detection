# 설치 및 실행 가이드

## 사전 요구사항

- Python 3.9 이상
- Node.js 16 이상
- npm 또는 yarn

## Backend 설정

### 1. 가상환경 생성 및 활성화

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenAI API Key (필수)
OPENAI_API_KEY=your_openai_api_key_here

# Twilio VoIP 설정 (선택사항)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google Cloud Speech-to-Text (선택사항)
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# Flask 설정
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
```

### 4. 백엔드 서버 실행

```bash
cd backend
python run.py
```

서버가 `http://localhost:5000`에서 실행됩니다.

## Frontend 설정

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 웹 서버 실행

```bash
npx serve -s . -l 3000
```

브라우저에서 `http://localhost:3000` 접속

## 테스트

### API 테스트

```bash
# 서버 상태 확인
curl http://localhost:5000/health

# 통화 시작 테스트
curl -X POST http://localhost:5000/api/call/start \
  -H "Content-Type: application/json" \
  -d '{"caller_number": "010-1234-5678", "user_id": "test_user"}'
```

## API 키 발급 가이드

### OpenAI API Key
1. https://platform.openai.com 접속
2. 계정 생성 및 로그인
3. API Keys 메뉴에서 새 키 생성

### Twilio (VoIP 통화용, 선택사항)
1. https://www.twilio.com 접속
2. 무료 계정 생성
3. Console에서 Account SID와 Auth Token 확인
4. Phone Numbers에서 번호 구매

### Google Cloud Speech-to-Text (선택사항)
1. https://cloud.google.com 접속
2. 프로젝트 생성
3. Speech-to-Text API 활성화
4. 서비스 계정 키 생성

## 문제 해결

### 포트 충돌
- 백엔드 포트 변경: `.env` 파일에서 `PORT=5001` 등으로 변경
- 프론트엔드 API URL 변경: `frontend/app-full.js`에서 `API_BASE_URL` 수정

### 모듈 import 오류
- Python 경로 확인: `backend` 디렉토리에서 실행하는지 확인
- Node 모듈 재설치: `rm -rf node_modules && npm install`

## 개발 모드

개발 중에는 다음을 사용하세요:

- **Backend**: Flask의 자동 리로드 기능 사용 (`FLASK_DEBUG=True`)
- **Frontend**: 브라우저 새로고침으로 변경사항 확인

## 프로덕션 배포

프로덕션 배포 시:

1. `.env` 파일에서 `FLASK_DEBUG=False` 설정
2. API 키를 안전하게 관리 (환경 변수 또는 시크릿 관리 서비스 사용)
3. HTTPS 사용 필수
4. CORS 설정 확인
