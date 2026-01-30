# 웹앱 실행 방법

## 빠른 시작

1. **백엔드 서버 실행** (이미 실행 중일 수 있음)
   ```powershell
   cd C:\Users\Administrator\police
   .\venv\Scripts\Activate.ps1
   cd backend
   python run.py
   ```

2. **웹 서버 실행**
   ```powershell
   cd C:\Users\Administrator\police\frontend
   npx serve -s . -l 3000
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

## 문제 해결

### 404 에러가 발생하는 경우:
1. 웹 서버가 실행 중인지 확인
2. `http://localhost:3000` (포트 3000)로 접속
3. `http://localhost:3000/index.html` 또는 `http://localhost:3000/web.html` 시도

### 백엔드 연결 오류:
- 백엔드가 `http://localhost:5000`에서 실행 중인지 확인
- 브라우저에서 `http://localhost:5000/health` 접속하여 확인

