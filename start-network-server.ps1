# 네트워크 서버 시작 스크립트
# 같은 네트워크의 다른 PC에서 접속 가능하도록 설정

Write-Host "=== 5분 방패 AI 네트워크 서버 시작 ===" -ForegroundColor Cyan
Write-Host ""

# 현재 PC의 IP 주소 확인
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
} | Select-Object -ExpandProperty IPAddress

if ($ipAddresses.Count -eq 0) {
    Write-Host "IP 주소를 찾을 수 없습니다." -ForegroundColor Red
    exit 1
}

$serverIP = $ipAddresses[0]
Write-Host "서버 IP 주소: $serverIP" -ForegroundColor Green
Write-Host ""
Write-Host "접속 URL:" -ForegroundColor Yellow
Write-Host "  프론트엔드: http://$serverIP:3000" -ForegroundColor Cyan
Write-Host "  백엔드: http://$serverIP:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "다른 PC에서 접속하려면 위 URL을 사용하세요." -ForegroundColor Yellow
Write-Host ""

# 방화벽 규칙 추가 (관리자 권한 필요)
Write-Host "방화벽 규칙 추가 중..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "5분 방패 AI - Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "5분 방패 AI - Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
    Write-Host "방화벽 규칙 추가 완료" -ForegroundColor Green
} catch {
    Write-Host "방화벽 규칙 추가 실패 (관리자 권한 필요할 수 있음)" -ForegroundColor Yellow
}
Write-Host ""

# 백엔드 시작
Write-Host "백엔드 서버 시작 중..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; if (Test-Path venv\Scripts\Activate.ps1) { . venv\Scripts\Activate.ps1 }; python backend/run.py"

# 잠시 대기
Start-Sleep -Seconds 3

# 프론트엔드 시작
Write-Host "프론트엔드 서버 시작 중..." -ForegroundColor Yellow
Write-Host ""
Write-Host "서버가 실행 중입니다. 종료하려면 Ctrl+C를 누르세요." -ForegroundColor Green
Write-Host ""

cd frontend
npx serve -s . -l 3000 --host 0.0.0.0



