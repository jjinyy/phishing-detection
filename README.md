# 5분 방패 AI - 사기범과 나 사이에 서는 AI 통화 보호막

## 프로젝트 개요

낯선 전화가 오면 AI가 최대 5분간 대신 통화하여 피싱 여부를 분석하고, 사용자는 통화 결과 보고서만 보고 안전하게 판단하는 AI 기반 피싱 예방 서비스입니다.

## 핵심 가치

- 사용자는 사기범과 직접 대화하지 않는다
- 피싱 위험은 통화 이후가 아닌, 통화 순간에 차단한다

## 주요 기능

1. **AI 대리 통화 기능** (최대 5분)
   - 앱 내 VoIP 기반 AI 통화
   - 개인정보는 가짜 정보 생성으로 대응

2. **실시간 스캠 패턴 분석**
   - 기관 사칭, 계좌 요구, 긴급성 압박 등
   - 대화 흐름 기반 스캠 유형 분류

3. **통화 결과 리포트 제공**
   - 판별 결과: 정상 / 의심 / 피싱 확정
   - 판단 근거 요약
   - 추정 스캠 유형
   - 권장 행동 가이드

4. **사용자 직접 판단 구조**
   - AI는 결정하지 않음
   - 사용자는 보고서를 보고 판단

## 프로젝트 구조

```
police/
├── backend/              # Flask 백엔드 서버
│   ├── app.py           # 메인 애플리케이션
│   ├── services/        # 비즈니스 로직
│   │   ├── ai_service.py      # AI 대화 서비스
│   │   ├── scam_analyzer.py   # 스캠 분석 서비스
│   │   └── stt_service.py     # 음성 인식 서비스
│   ├── models/          # 데이터 모델
│   └── utils/           # 유틸리티 함수
├── frontend/            # 웹앱 프론트엔드
│   ├── index.html       # 메인 HTML 파일
│   ├── app-full.js      # React 앱 전체 코드
│   └── services/        # STT/TTS 서비스
├── requirements.txt     # Python 의존성
└── README.md           # 프로젝트 문서
```

## 기술 스택

### Backend
- Python 3.9+
- Flask (웹 프레임워크)
- OpenAI API (LLM)
- Web Speech API (STT)
- Twilio (VoIP 통화)

### Frontend
- React 18 (CDN)
- HTML/JavaScript
- Web Speech API (STT/TTS)

## 설치 및 실행

### Backend 설정

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (.env 파일 생성)
# OPENAI_API_KEY=your_openai_api_key

# 서버 실행
cd backend
python run.py
```

### Frontend 설정

```bash
cd frontend
npx serve -s . -l 3000
```

브라우저에서 `http://localhost:3000` 접속

## 환경 변수

`.env` 파일에 다음 변수들을 설정하세요:

```
OPENAI_API_KEY=your_openai_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key (선택사항)
```

## 사용 시나리오

1. 사용자가 낯선 번호로부터 전화 수신
2. "AI 대신 받기" 버튼 선택
3. AI가 전화를 받아 대화 진행 (최대 5분)
4. 통화 종료
5. 사용자에게 결과 리포트 도착

## 개인정보 보호

- 통화 음성 서버 저장 없음
- 실시간 처리 후 즉시 폐기
- 사용자 동의 기반 서비스 운영

## 라이선스

MIT License
