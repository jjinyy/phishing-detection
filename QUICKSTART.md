# 빠른 시작 가이드

## 1단계: 백엔드 실행

### PowerShell에서 실행:

```powershell
# 1. 프로젝트 루트로 이동
cd C:\Users\Administrator\police

# 2. 가상환경 생성
python -m venv venv

# 3. 가상환경 활성화
.\venv\Scripts\Activate.ps1

# 4. 의존성 설치
pip install -r requirements.txt

# 5. .env 파일 생성 (아직 없다면)
# 메모장이나 에디터로 .env 파일을 만들고 아래 내용 추가:
# OPENAI_API_KEY=your_key_here
# FLASK_ENV=development
# FLASK_DEBUG=True
# PORT=5000

# 6. 백엔드 서버 실행
cd backend
python run.py
```

서버가 `http://localhost:5000`에서 실행됩니다.

## 2단계: 프론트엔드 실행 (새 터미널 창에서)

```powershell
# 1. 프로젝트 루트로 이동
cd C:\Users\Administrator\police

# 2. frontend 디렉토리로 이동
cd frontend

# 3. 의존성 설치 (처음 한 번만)
npm install

# 4. 웹 서버 시작
npx serve -s . -l 3000
```

브라우저에서 `http://localhost:3000` 접속

## 주의사항

1. **.env 파일이 없으면**: 프로젝트 루트에 `.env` 파일을 만들고 최소한 `OPENAI_API_KEY`를 설정하세요.
2. **포트 충돌**: 5000번 포트가 사용 중이면 `.env`에서 `PORT=5001`로 변경
3. **Python 버전**: Python 3.9 이상 필요 (`python --version`으로 확인)

## 테스트

백엔드가 실행 중일 때:

```powershell
# 서버 상태 확인
curl http://localhost:5000/health

# 또는 브라우저에서
# http://localhost:5000/health 접속
```
