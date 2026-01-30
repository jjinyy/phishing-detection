# 프론트엔드 실행 스크립트
Write-Host "📱 5분 방패 AI - 프론트엔드 시작" -ForegroundColor Cyan

# frontend 디렉토리로 이동
if (-not (Test-Path frontend)) {
    Write-Host "❌ frontend 디렉토리를 찾을 수 없습니다!" -ForegroundColor Red
    exit 1
}

cd frontend

# node_modules 확인
if (-not (Test-Path node_modules)) {
    Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🌟 React Native 개발 서버 시작 중..." -ForegroundColor Green
Write-Host ""

npm start

