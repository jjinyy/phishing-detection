# 프로젝트 구조

## 📁 전체 구조

```
police/
├── backend/                    # Flask 백엔드 서버
│   ├── app.py                 # 메인 Flask 애플리케이션
│   ├── config.py              # 설정 파일
│   ├── run.py                 # 서버 실행 스크립트
│   ├── services/              # 비즈니스 로직 서비스
│   │   ├── __init__.py
│   │   ├── ai_service.py      # AI 대화 서비스 (OpenAI)
│   │   ├── scam_analyzer.py   # 스캠 패턴 분석 서비스
│   │   ├── stt_service.py     # 음성 인식 서비스
│   │   └── voip_service.py    # VoIP 통화 서비스 (Twilio)
│   ├── models/                # 데이터 모델
│   │   └── __init__.py
│   └── utils/                 # 유틸리티 함수
│       ├── __init__.py
│       └── helpers.py         # 헬퍼 함수들
│
├── frontend/                   # React Native 앱
│   ├── App.js                 # 메인 앱 컴포넌트
│   ├── index.js               # 앱 진입점
│   ├── package.json           # Node.js 의존성
│   ├── babel.config.js        # Babel 설정
│   ├── metro.config.js        # Metro 번들러 설정
│   └── src/
│       ├── screens/           # 화면 컴포넌트
│       │   ├── HomeScreen.js           # 홈 화면
│       │   ├── IncomingCallScreen.js   # 전화 수신 화면
│       │   └── CallReportScreen.js      # 리포트 화면
│       └── services/          # API 서비스
│           └── api.js         # 백엔드 API 클라이언트
│
├── README.md                  # 프로젝트 개요
├── SETUP.md                   # 설치 가이드
├── requirements.txt           # Python 의존성
└── .gitignore                # Git 무시 파일
```

## 🔄 데이터 흐름

### 통화 처리 흐름

```
1. 사용자 → 전화 수신
   ↓
2. 프론트엔드 → "AI 대신 받기" 선택
   ↓
3. 프론트엔드 → POST /api/call/start
   ↓
4. 백엔드 → 통화 세션 생성
   ↓
5. 통화 진행 중:
   - 음성 → STT 서비스 → 텍스트 변환
   - 텍스트 → 스캠 분석기 → 스캠 점수 계산
   - 텍스트 + 점수 → AI 서비스 → 응답 생성
   - 응답 → TTS → 음성으로 변환
   ↓
6. 통화 종료 → POST /api/call/end
   ↓
7. 백엔드 → 리포트 생성
   ↓
8. 프론트엔드 → 리포트 화면 표시
```

## 🎯 주요 컴포넌트 설명

### Backend

#### `app.py`
- Flask 애플리케이션 메인 파일
- API 엔드포인트 정의
- 요청/응답 처리

#### `services/ai_service.py`
- OpenAI API를 사용한 AI 대화 생성
- 스캠 점수에 따른 응답 전략 조정

#### `services/scam_analyzer.py`
- 스캠 패턴 분석 및 점수 계산
- 리포트 생성
- 스캠 유형 분류

#### `services/stt_service.py`
- 음성을 텍스트로 변환 (Speech-to-Text)
- Google Cloud Speech-to-Text 통합

#### `services/voip_service.py`
- Twilio를 사용한 VoIP 통화 처리
- TwiML 응답 생성

### Frontend

#### `App.js`
- React Navigation 설정
- 화면 라우팅

#### `screens/HomeScreen.js`
- 홈 화면
- 서비스 안내 및 테스트 버튼

#### `screens/IncomingCallScreen.js`
- 전화 수신 화면
- AI 대신 받기 기능
- 통화 진행 상태 표시

#### `screens/CallReportScreen.js`
- 통화 결과 리포트 화면
- 스캠 분석 결과 표시
- 권장 행동 가이드

#### `services/api.js`
- 백엔드 API 클라이언트
- HTTP 요청 처리

## 🔌 API 엔드포인트

### `GET /health`
서버 상태 확인

### `POST /api/call/start`
AI 대리 통화 시작
- Request: `{ "caller_number": "...", "user_id": "..." }`
- Response: `{ "call_id": "...", "status": "started" }`

### `POST /api/call/process-audio`
통화 중 음성 데이터 처리
- Request: `{ "call_id": "...", "audio_data": "..." }`
- Response: `{ "transcript": "...", "ai_response": "...", "scam_score": 0.7 }`

### `POST /api/call/end`
통화 종료 및 리포트 생성
- Request: `{ "call_id": "...", "conversation_history": [...] }`
- Response: `{ "report": {...} }`

### `GET /api/call/report/<call_id>`
통화 리포트 조회

## 🔐 환경 변수

필수:
- `OPENAI_API_KEY`: OpenAI API 키

선택사항:
- `TWILIO_ACCOUNT_SID`: Twilio 계정 SID
- `TWILIO_AUTH_TOKEN`: Twilio 인증 토큰
- `GOOGLE_CLOUD_API_KEY`: Google Cloud API 키
- `PORT`: 서버 포트 (기본값: 5000)
- `FLASK_ENV`: Flask 환경 (development/production)
- `FLASK_DEBUG`: 디버그 모드 (True/False)

