# STT/TTS 통합 가이드

## 📋 개요

STT(Speech-to-Text)와 TTS(Text-to-Speech)를 프로젝트에 통합하는 방법과 연결 구조를 설명합니다.

---

## 🎯 추천 아키텍처: 하이브리드 방식

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
   - ✅ API 키 불필요
   - ✅ 빠른 응답 속도
   - ✅ 무료 사용
   - ✅ 실시간 처리

2. **TTS도 클라이언트 사이드 (Web Speech API)**
   - ✅ API 키 불필요
   - ✅ 자연스러운 음성
   - ✅ 무료 사용
   - ✅ 즉시 재생 가능

3. **백엔드는 텍스트 분석에 집중**
   - ✅ AI 응답 생성
   - ✅ 스캠 패턴 분석
   - ✅ 리포트 생성

---

## 🔧 구현 방법

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
    if (this.recognition && this.isListening) {
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

    // 이전 음성 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; // 한국어
    utterance.rate = 1.0; // 속도 (0.1 ~ 10)
    utterance.pitch = 1.0; // 음높이 (0 ~ 2)
    utterance.volume = 1.0; // 볼륨 (0 ~ 1)

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    window.speechSynthesis.cancel();
  }

  pause() {
    window.speechSynthesis.pause();
  }

  resume() {
    window.speechSynthesis.resume();
  }
}
```

### 2. 통화 흐름 통합

```javascript
// 통화 중 음성 처리 흐름
class VoiceCallHandler {
  constructor() {
    this.stt = new STTService();
    this.tts = new TTSService();
    this.callId = null;
    this.conversationHistory = [];
  }

  async startCall(callerNumber) {
    // 1. 백엔드에 통화 시작 알림
    const response = await callService.startCall(callerNumber);
    this.callId = response.call_id;

    // 2. STT 시작 (상대방 음성 듣기)
    this.stt.startListening(
      (text) => this.handleCallerSpeech(text),
      (error) => this.handleSTTError(error)
    );

    // 3. AI 인사말 재생
    this.tts.speak('안녕하세요, 무엇을 도와드릴까요?');
  }

  async handleCallerSpeech(text) {
    // 1. 상대방 말을 대화 내역에 추가
    this.conversationHistory.push({
      speaker: 'caller',
      text: text,
      timestamp: new Date().toISOString()
    });

    // 2. 백엔드로 전송하여 AI 응답 생성
    const response = await callService.processAudio(this.callId, text);

    // 3. AI 응답을 대화 내역에 추가
    this.conversationHistory.push({
      speaker: 'ai',
      text: response.ai_response,
      timestamp: new Date().toISOString()
    });

    // 4. 스캠 점수 업데이트
    this.updateScamScore(response.scam_score);

    // 5. AI 응답을 음성으로 재생
    this.tts.speak(response.ai_response, () => {
      // 재생 완료 후 다시 STT 대기
      console.log('AI 응답 재생 완료');
    });
  }

  endCall() {
    // 1. STT 중지
    this.stt.stopListening();

    // 2. TTS 중지
    this.tts.stop();

    // 3. 백엔드에 통화 종료 알림 및 리포트 생성
    callService.endCall(this.callId, this.conversationHistory);
  }
}
```

---

## 🔄 데이터 흐름 상세

### 통화 시작 → 음성 인식 → AI 응답 → 음성 재생

```
1. [사용자] "AI 대신 받기" 클릭
   ↓
2. [프론트엔드] STT 시작 (Web Speech API)
   ↓
3. [상대방] 음성 입력
   ↓
4. [브라우저] STT → 텍스트 변환
   ↓
5. [프론트엔드] POST /api/call/process-audio
   {
     "call_id": "call_123",
     "audio_data": "안녕하세요, 금융감독원입니다"
   }
   ↓
6. [백엔드] 
   - STT 서비스 (현재는 텍스트 그대로 받음)
   - 스캠 분석
   - AI 응답 생성
   ↓
7. [백엔드 응답]
   {
     "transcript": "안녕하세요, 금융감독원입니다",
     "ai_response": "아... 네? 금융감독원이요?",
     "scam_score": 0.15
   }
   ↓
8. [프론트엔드]
   - 대화 내역 업데이트
   - 스캠 점수 업데이트
   - TTS로 AI 응답 재생
   ↓
9. [브라우저] TTS → 음성 재생
   ↓
10. [반복] 3번부터 반복
```

---

## 📝 백엔드 API 수정 사항

### 현재 API 구조 유지

백엔드는 이미 텍스트 기반으로 설계되어 있으므로 큰 변경 없이 사용 가능:

```python
# backend/app.py의 /api/call/process-audio 엔드포인트
@app.route('/api/call/process-audio', methods=['POST'])
def process_audio():
    data = request.json
    call_id = data.get('call_id')
    audio_data = data.get('audio_data')  # 이미 텍스트로 받음
    
    # STT는 프론트엔드에서 처리되므로 여기서는 텍스트 그대로 사용
    transcript = audio_data  # 또는 필요시 추가 처리
    
    # 스캠 분석
    scam_score = scam_analyzer.analyze(transcript)
    
    # AI 응답 생성
    ai_response = ai_service.generate_response(transcript, scam_score)
    
    return jsonify({
        "transcript": transcript,
        "ai_response": ai_response,
        "scam_score": scam_score
    })
```

**변경 사항**: `audio_data`가 이미 텍스트이므로 STT 변환 단계 생략 가능

---

## 🎨 프론트엔드 통합 예시

### IncomingCallScreen 수정

```javascript
function IncomingCallScreen({ callerNumber, onEndCall, onReport }) {
  const [callStatus, setCallStatus] = useState('incoming');
  const [callId, setCallId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [scamScore, setScamScore] = useState(0);
  
  // STT/TTS 서비스
  const sttServiceRef = useRef(null);
  const ttsServiceRef = useRef(null);
  const voiceCallHandlerRef = useRef(null);

  useEffect(() => {
    // STT/TTS 서비스 초기화
    sttServiceRef.current = new STTService();
    ttsServiceRef.current = new TTSService();
    voiceCallHandlerRef.current = new VoiceCallHandler();
    
    return () => {
      // 정리
      if (sttServiceRef.current) {
        sttServiceRef.current.stopListening();
      }
      if (ttsServiceRef.current) {
        ttsServiceRef.current.stop();
      }
    };
  }, []);

  const handleAIAccept = async () => {
    try {
      setCallStatus('ai_talking');
      
      // 통화 시작
      await voiceCallHandlerRef.current.startCall(callerNumber);
      
      // 통화 ID 저장
      const response = await callService.startCall(callerNumber);
      setCallId(response.call_id);
      
    } catch (error) {
      alert('통화 시작에 실패했습니다.');
    }
  };

  const handleEndCall = async () => {
    // 음성 처리 중지
    voiceCallHandlerRef.current.endCall();
    
    // 리포트 생성
    // ... 기존 로직
  };

  // ... 나머지 코드
}
```

---

## 🔧 대안: 백엔드 STT/TTS 사용

만약 백엔드에서 STT/TTS를 처리하고 싶다면:

### 옵션 1: Google Cloud Speech-to-Text (STT)

```python
# backend/services/stt_service.py
from google.cloud import speech

class STTService:
    def __init__(self):
        self.client = speech.SpeechClient()
    
    def transcribe(self, audio_data: bytes) -> str:
        audio = speech.RecognitionAudio(content=audio_data)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=16000,
            language_code="ko-KR"
        )
        
        response = self.client.recognize(config=config, audio=audio)
        return response.results[0].alternatives[0].transcript
```

### 옵션 2: Google Cloud Text-to-Speech (TTS)

```python
# backend/services/tts_service.py
from google.cloud import texttospeech

class TTSService:
    def __init__(self):
        self.client = texttospeech.TextToSpeechClient()
    
    def synthesize(self, text: str) -> bytes:
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="ko-KR",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        response = self.client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content
```

### 백엔드 STT/TTS 사용 시 API 구조

```python
# 음성 데이터를 받아서 처리
@app.route('/api/call/process-audio', methods=['POST'])
def process_audio():
    audio_file = request.files['audio']  # 오디오 파일
    audio_data = audio_file.read()
    
    # STT
    transcript = stt_service.transcribe(audio_data)
    
    # AI 응답 생성
    ai_response = ai_service.generate_response(transcript)
    
    # TTS
    audio_response = tts_service.synthesize(ai_response)
    
    return jsonify({
        "transcript": transcript,
        "ai_response": ai_response,
        "audio_response": base64.b64encode(audio_response).decode('utf-8')
    })
```

---

## 💡 추천 방식 비교

| 방식 | 장점 | 단점 | 추천도 |
|------|------|------|--------|
| **웹 브라우저 API** | ✅ 무료<br>✅ 빠른 응답<br>✅ API 키 불필요<br>✅ 실시간 처리 | ❌ 브라우저 호환성<br>❌ 정확도 제한 | ⭐⭐⭐⭐⭐ |
| **백엔드 STT/TTS** | ✅ 높은 정확도<br>✅ 일관성<br>✅ 다양한 언어 | ❌ API 키 필요<br>❌ 비용 발생<br>❌ 지연 시간 | ⭐⭐⭐ |

### 최종 추천: **웹 브라우저 API 방식**

**이유:**
1. 프로토타입 단계에서는 무료이고 빠름
2. 백엔드는 텍스트 분석에 집중 가능
3. 나중에 필요시 백엔드로 전환 가능

---

## 🚀 구현 단계

### Phase 1: 기본 STT/TTS 통합
1. ✅ Web Speech API 서비스 클래스 생성
2. ✅ 통화 화면에 STT/TTS 통합
3. ✅ 음성 입력 → 텍스트 → 백엔드 전송
4. ✅ 백엔드 응답 → TTS 재생

### Phase 2: 개선
1. ⚠️ 음성 품질 개선
2. ⚠️ 에러 처리 강화
3. ⚠️ 음성 인식 정확도 향상

### Phase 3: 고급 기능
1. ❌ 백엔드 STT/TTS 옵션 추가
2. ❌ 음성 녹음 및 재생
3. ❌ 다국어 지원

---

## 📚 참고 자료

- [Web Speech API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Speech Synthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)

---

## 🔍 브라우저 호환성

### Speech Recognition API
- ✅ Chrome/Edge: 지원
- ✅ Safari: 부분 지원 (webkit)
- ❌ Firefox: 미지원

### Speech Synthesis API
- ✅ 모든 주요 브라우저 지원

---

## 💻 구현 예시 코드 위치

구현 시 다음 파일들을 수정/추가하면 됩니다:

1. **프론트엔드 서비스 추가**
   - `frontend/services/stt-service.js` (신규)
   - `frontend/services/tts-service.js` (신규)
   - `frontend/services/voice-call-handler.js` (신규)

2. **프론트엔드 컴포넌트 수정**
   - `frontend/app-full.js`의 `IncomingCallScreen` 컴포넌트

3. **백엔드 (선택사항)**
   - `backend/services/stt_service.py` (실제 API 연동)
   - `backend/services/tts_service.py` (신규, 선택사항)

