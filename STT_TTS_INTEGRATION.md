# STT/TTS 통합 가이드

## 개요

STT(Speech-to-Text)와 TTS(Text-to-Speech)를 프로젝트에 통합하는 방법과 연결 구조를 설명합니다.

---

## 추천 아키텍처: 하이브리드 방식

### 구조 개요

```
[사용자 음성] 
    ↓
[브라우저 Web Speech API - STT] 
    ↓
[텍스트 전송] → [백엔드 Flask API]
    ↓
[AI 응답 생성] → [스캠 분석]
    ↓
[텍스트 응답 반환]
    ↓
[브라우저 Web Speech API - TTS]
    ↓
[AI 음성 재생]
```

### 선택 이유

1. **STT는 클라이언트 사이드 (Web Speech API)**
   - API 키 불필요
   - 빠른 응답 속도
   - 무료 사용
   - 실시간 처리

2. **TTS도 클라이언트 사이드 (Web Speech API)**
   - API 키 불필요
   - 자연스러운 음성
   - 무료 사용
   - 즉시 재생 가능

3. **백엔드는 텍스트 분석에 집중**
   - AI 응답 생성
   - 스캠 패턴 분석
   - 리포트 생성

---

## 구현 방법

### 1. 프론트엔드: Web Speech API 통합

#### STT (음성 → 텍스트)

```javascript
// 음성 인식 서비스
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

class STTService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
  }

  startListening(onResult, onError) {
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'ko-KR'; // 한국어
    this.recognition.continuous = true; // 연속 인식
    this.recognition.interimResults = true; // 중간 결과도 받기

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      onError(event.error);
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
```

#### TTS (텍스트 → 음성)

```javascript
// 음성 합성 서비스
class TTSService {
  speak(text, onEnd) {
    if (!window.speechSynthesis) {
      console.error('Speech Synthesis API not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; // 한국어
    utterance.rate = 1.0; // 속도
    utterance.pitch = 1.0; // 음높이
    utterance.volume = 1.0; // 볼륨

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
```

### 2. 백엔드: 텍스트 분석

백엔드는 STT/TTS를 처리하지 않고, 텍스트만 받아서 분석합니다:

```python
# backend/app.py
@app.route('/api/call/process-audio', methods=['POST'])
def process_audio():
    data = request.json
    text = data.get('audio_data')  # 실제로는 텍스트
    call_id = data.get('call_id')
    user_role = data.get('user_role', 'scammer')
    
    # 스캠 분석
    scam_score = scam_analyzer.analyze(text)
    
    # AI 응답 생성
    ai_response = ai_service.generate_response(text, scam_score, user_role)
    
    return jsonify({
        'transcript': text,
        'ai_response': ai_response,
        'scam_score': scam_score
    })
```

---

## 통합 흐름

### 전체 통화 흐름

1. **사용자가 마이크로 말함**
   - STT 서비스가 음성을 텍스트로 변환

2. **텍스트를 백엔드로 전송**
   - `/api/call/process-audio` 엔드포인트 호출
   - 대화 히스토리 포함

3. **백엔드에서 분석 및 응답 생성**
   - 스캠 패턴 분석
   - AI 응답 생성

4. **AI 응답을 TTS로 재생**
   - 텍스트를 음성으로 변환
   - 스피커로 재생

5. **반복** (통화 종료까지)

---

## 브라우저 호환성

### Web Speech API 지원 브라우저

- Chrome/Edge: 완전 지원
- Safari: 부분 지원 (iOS에서 제한적)
- Firefox: 지원 안 함

### 대안

브라우저가 Web Speech API를 지원하지 않으면:
- Google Cloud Speech-to-Text API 사용
- 또는 텍스트 입력 모드로 전환

---

## 마이크 권한 처리

### 권한 요청

```javascript
// 마이크 권한 요청
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    // 권한 허용됨
    sttService.startListening();
  })
  .catch(error => {
    // 권한 거부됨
    console.error('Microphone permission denied');
  });
```

### 권한 오류 처리

- 사용자에게 권한 요청 안내
- 브라우저 설정에서 권한 허용 방법 안내
- 권한이 없으면 텍스트 입력 모드로 전환

---

## 문제 해결

### 마이크가 작동하지 않음

1. 브라우저 설정에서 마이크 권한 확인
2. Chrome/Edge 브라우저 사용 권장
3. HTTPS 또는 localhost에서만 작동

### 음성 인식이 안 됨

1. 한국어 설정 확인 (`lang: 'ko-KR'`)
2. 마이크가 정상 작동하는지 확인
3. 브라우저 콘솔에서 오류 확인

### TTS가 작동하지 않음

1. 브라우저가 Speech Synthesis API를 지원하는지 확인
2. 볼륨 설정 확인
3. 다른 탭에서 TTS가 실행 중인지 확인

---

## 성능 최적화

### STT 최적화

- `continuous: true`로 설정하여 연속 인식
- `interimResults: true`로 중간 결과도 받기
- 불필요한 재시작 방지

### TTS 최적화

- 이전 음성 재생 취소 후 새 음성 재생
- 큐 관리로 중복 재생 방지

---

## 보안 고려사항

### 클라이언트 사이드 처리

- 음성 데이터는 서버로 전송되지 않음
- 텍스트만 서버로 전송
- 개인정보 보호 강화

### 서버 사이드 처리

- 텍스트 데이터만 처리
- 음성 파일 저장 안 함
- 실시간 처리 후 즉시 폐기

---

## 결론

Web Speech API를 사용한 하이브리드 방식이 이 프로젝트에 가장 적합합니다:
- API 키 불필요
- 빠른 응답 속도
- 무료 사용
- 개인정보 보호 강화

백엔드는 텍스트 분석에만 집중하여 구조가 단순하고 유지보수가 쉽습니다.
