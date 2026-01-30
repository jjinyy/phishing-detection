# 네트워크 접속 설정 가이드

## 같은 네트워크의 다른 PC에서 접속하기

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

백엔드를 실행할 때 모든 네트워크 인터페이스에서 접속을 허용하도록 설정합니다:

```powershell
cd backend
python run.py
```

또는 `start-network-server.ps1` 스크립트를 사용하면 자동으로 방화벽 규칙을 추가합니다.

#### 1-3. 프론트엔드 서버 실행

프론트엔드를 실행할 때도 모든 네트워크 인터페이스에서 접속을 허용하도록 설정합니다:

```powershell
cd frontend
npx serve -s . -l 3000 --host 0.0.0.0
```

### 2. 클라이언트 PC (다른 PC) 설정

#### 2-1. 브라우저에서 접속

클라이언트 PC의 브라우저에서 다음 주소로 접속:

```
http://192.168.0.100:3000
```

(192.168.0.100은 서버 PC의 IP 주소로 변경하세요)

#### 2-2. 백엔드 API 연결 확인

프론트엔드가 자동으로 서버 IP를 감지하여 백엔드 API에 연결합니다. 만약 연결이 안 되면:

1. 서버 PC의 백엔드가 실행 중인지 확인
2. 서버 PC의 IP 주소가 올바른지 확인
3. 방화벽 설정 확인

### 3. 방화벽 설정 (Windows)

#### 3-1. PowerShell 관리자 권한으로 실행

```powershell
# 포트 5000 (백엔드) 허용
New-NetFirewallRule -DisplayName "5분 방패 AI Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# 포트 3000 (프론트엔드) 허용
New-NetFirewallRule -DisplayName "5분 방패 AI Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

#### 3-2. 또는 자동 스크립트 사용

`start-network-server.ps1` 스크립트를 실행하면 자동으로 방화벽 규칙을 추가합니다:

```powershell
.\start-network-server.ps1
```

### 4. 문제 해결

#### 포트가 열려있지 않음
- 방화벽 규칙이 제대로 추가되었는지 확인
- Windows 방화벽 설정에서 수동으로 규칙 추가

#### IP 주소를 찾을 수 없음
- 같은 네트워크(Wi-Fi 또는 이더넷)에 연결되어 있는지 확인
- 라우터 설정 확인

#### 연결은 되지만 백엔드 API 호출 실패
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인 (이미 모든 origin 허용으로 설정됨)

### 5. 보안 주의사항

- 이 설정은 로컬 네트워크에서만 사용하세요
- 인터넷에 노출되지 않도록 주의하세요
- 프로덕션 환경에서는 HTTPS와 인증을 사용하세요
