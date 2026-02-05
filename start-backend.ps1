# 백엔드 서버 실행 스크립트
Write-Host "🚀 5분 방패 AI - 백엔드 서버 시작" -ForegroundColor Cyan

# .env 파일 확인
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env 파일이 없습니다. 생성 중..." -ForegroundColor Yellow
    @"
OPENAI_API_KEY=your_openai_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ .env 파일을 생성했습니다. OPENAI_API_KEY를 설정해주세요!" -ForegroundColor Green
    Write-Host ""
}

# 가상환경 확인
if (-not (Test-Path venv)) {
    Write-Host "📦 가상환경 생성 중..." -ForegroundColor Yellow
    python -m venv venv
}

# 가상환경 활성화
Write-Host "🔧 가상환경 활성화 중..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# 의존성 설치 확인
Write-Host "📥 의존성 확인 중..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# 백엔드 디렉토리로 이동하여 서버 실행
Write-Host ""
Write-Host "🌟 백엔드 서버 시작 중..." -ForegroundColor Green
Write-Host "서버 주소: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""

cd backend
python run.py



