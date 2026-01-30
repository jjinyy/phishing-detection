# 네트워크 접속 설정 가이드

## 🌐 같은 네트워크의 다른 PC에서 접속하기

### 1. 서버 PC (현재 PC) 설정

#### 1-1. 현재 PC의 IP 주소 확인

**Windows:**
```powershell
ipconfig
```
또는
```powershell
ipconfig | findstr /i "IPv4"
```

**macOS/Linux:**
```bash
ifconfig
```
또는
```bash
ip addr show
```

예시: `192.168.0.100` (이 IP 주소를 기억하세요)

#### 1-2. 백엔드 서버 실행

백엔드는 이미 `0.0.0.0`으로 설정되어 있어 외부 접근이 가능합니다.

```bash
# 백엔드 실행
python backend/run.py
```

또는

```powershell
# PowerShell
.\start-backend.ps1
```

백엔드는 `http://0.0.0.0:5000` 또는 `http://[서버IP]:5000`에서 실행됩니다.

#### 1-3. 프론트엔드 서버 실행 (외부 접근 허용)

**방법 1: npx serve 사용 (권장)**

```bash
cd frontend
npx serve -s . -l 3000 --host 0.0.0.0
```

**방법 2: Python HTTP 서버 사용**

```bash
cd frontend
python -m http.server 3000 --bind 0.0.0.0
```

#### 1-4. Windows 방화벽 설정

Windows 방화벽에서 포트 3000과 5000을 허용해야 합니다:

1. **제어판** → **시스템 및 보안** → **Windows Defender 방화벽**
2. **고급 설정** → **인바운드 규칙** → **새 규칙**
3. **포트** 선택 → **TCP** → **특정 로컬 포트**: `3000, 5000`
4. **연결 허용** 선택 → 완료

또는 PowerShell에서:

```powershell
# 관리자 권한으로 실행
New-NetFirewallRule -DisplayName "5분 방패 AI - Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "5분 방패 AI - Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### 2. 클라이언트 PC (다른 PC) 설정

#### 2-1. 프론트엔드 API URL 수정

**옵션 1: 자동 IP 감지 (권장)**

프론트엔드가 자동으로 서버 IP를 감지하도록 설정되어 있습니다.

**옵션 2: 수동 설정**

`frontend/app-full.js` 파일에서:

```javascript
// 현재 (localhost)
const API_BASE_URL = 'http://localhost:5000/api';

// 변경 (서버 PC의 IP 주소로 변경)
const API_BASE_URL = 'http://192.168.0.100:5000/api';
```

#### 2-2. 브라우저에서 접속

클라이언트 PC의 브라우저에서:

```
http://[서버IP]:3000
```

예시: `http://192.168.0.100:3000`

### 3. 자동 IP 감지 기능

프론트엔드가 자동으로 서버 IP를 감지하도록 설정되어 있습니다:

1. 현재 URL의 호스트를 확인
2. localhost가 아니면 해당 호스트 사용
3. localhost면 자동으로 서버 IP 감지 시도

### 4. 문제 해결

#### 문제 1: 연결할 수 없음

**해결:**
- 서버 PC의 IP 주소가 올바른지 확인
- 서버 PC의 방화벽에서 포트 3000, 5000 허용 확인
- 같은 네트워크(Wi-Fi/이더넷)에 연결되어 있는지 확인

#### 문제 2: CORS 에러

**해결:**
- 백엔드의 CORS 설정이 `*`로 되어 있는지 확인 (`backend/app.py`)
- 서버 IP를 CORS 허용 목록에 추가

#### 문제 3: 백엔드 연결 실패

**해결:**
- `http://[서버IP]:5000/health` 접속하여 백엔드가 실행 중인지 확인
- 프론트엔드의 `API_BASE_URL`이 올바른지 확인

### 5. 빠른 설정 스크립트

**서버 PC에서 실행:**

```powershell
# PowerShell 스크립트 (start-network-server.ps1)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress | Select-Object -First 1
Write-Host "서버 IP: $ip" -ForegroundColor Green
Write-Host "프론트엔드: http://$ip:3000" -ForegroundColor Cyan
Write-Host "백엔드: http://$ip:5000" -ForegroundColor Cyan

# 방화벽 규칙 추가
New-NetFirewallRule -DisplayName "5분 방패 AI - Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "5분 방패 AI - Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

# 백엔드 시작
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python backend/run.py"

# 프론트엔드 시작
cd frontend
npx serve -s . -l 3000 --host 0.0.0.0
```

### 6. 보안 주의사항

⚠️ **개발 환경에서만 사용하세요!**

- 프로덕션 환경에서는 HTTPS 사용 필수
- 방화벽 규칙을 신중하게 설정
- 민감한 정보는 환경 변수로 관리
- 외부 네트워크 접근 시 추가 보안 조치 필요

