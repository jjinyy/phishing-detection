/**
 * Speech-to-Text 서비스 (Web Speech API 사용)
 */
class STTService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  }

  /**
   * 마이크 권한 상태 확인
   * @returns {Promise<string>} 'granted', 'denied', 'prompt', 또는 'unknown'
   */
  async checkMicrophonePermission() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' });
        console.log('마이크 권한 상태:', result.state);
        return result.state; // 'granted', 'denied', 'prompt'
      }
    } catch (error) {
      console.warn('권한 상태 확인 실패:', error);
    }
    
    // 권한 API가 없으면 getUserMedia로 확인 시도
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'denied';
      }
      return 'unknown';
    }
  }

  /**
   * 마이크 권한 요청
   * @returns {Promise<boolean>} 권한 허용 여부
   */
  async requestMicrophonePermission() {
    try {
      // 먼저 권한 상태 확인
      const permissionState = await this.checkMicrophonePermission();
      
      if (permissionState === 'granted') {
        console.log('마이크 권한이 이미 허용됨');
        return true;
      }
      
      if (permissionState === 'denied') {
        console.warn('마이크 권한이 거부됨');
        return false;
      }
      
      // 권한이 'prompt'이거나 'unknown'이면 getUserMedia로 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 권한이 허용되면 스트림 종료
      stream.getTracks().forEach(track => track.stop());
      console.log('마이크 권한 요청 성공');
      return true;
    } catch (error) {
      console.error('마이크 권한 요청 실패:', error.name, error.message);
      
      // NotAllowedError는 명확한 거부
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return false;
      }
      
      // 다른 에러는 권한 문제가 아닐 수 있으므로 true 반환 (Speech Recognition이 직접 시도하도록)
      console.warn('마이크 권한 확인 실패, Speech Recognition이 직접 시도함');
      return true;
    }
  }

  /**
   * 음성 인식 시작
   * @param {Function} onResult - 인식 결과 콜백 (text) => void
   * @param {Function} onError - 에러 콜백 (error, errorMessage) => void
   */
  async startListening(onResult, onError) {
    if (!this.SpeechRecognition) {
      console.error('Speech Recognition API not supported in this browser');
      if (onError) onError('NOT_SUPPORTED', '이 브라우저는 음성 인식을 지원하지 않음');
      return;
    }

    // 마이크 권한 확인 (선택적)
    // 주의: Speech Recognition API는 자체적으로 권한을 요청하므로,
    // 여기서는 권한이 명확히 거부된 경우만 체크하고, 나머지는 Speech Recognition이 직접 처리하도록 함
    try {
      if (navigator.permissions && navigator.permissions.query) {
        // 권한 상태 API가 있으면 확인 (더 정확함)
        const result = await navigator.permissions.query({ name: 'microphone' });
        console.log('마이크 권한 상태:', result.state);
        
        if (result.state === 'denied') {
          console.error('마이크 권한이 명확히 거부됨');
          if (onError) {
            onError('PERMISSION_DENIED', '마이크 권한이 거부됨. 브라우저 주소창의 자물쇠 아이콘을 클릭하여 마이크 권한을 "허용"으로 변경');
          }
          return;
        }
        
        // 권한이 'granted'이거나 'prompt'이면 계속 진행
        console.log('마이크 권한 상태:', result.state, '- Speech Recognition 시작');
      }
    } catch (error) {
      console.warn('권한 상태 API 확인 실패 (Speech Recognition이 직접 시도):', error);
      // 권한 확인이 실패해도 계속 진행 (Speech Recognition이 직접 권한을 요청함)
    }

    // 기존 recognition이 있으면 정리
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // 무시
      }
      this.recognition = null;
    }

    try {
      this.recognition = new this.SpeechRecognition();
      this.recognition.lang = 'ko-KR'; // 한국어
      this.recognition.continuous = true; // 연속 인식
      this.recognition.interimResults = true; // 중간 결과도 받기
      this.recognition.maxAlternatives = 1; // 최대 대안 수

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

        // 최종 결과가 있으면 콜백 호출
        if (finalTranscript.trim()) {
          console.log('STT 결과:', finalTranscript.trim());
          if (onResult) onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        console.error('STT 에러:', event.error);
        
        // not-allowed 에러인 경우 재시도 로직
        if (event.error === 'not-allowed') {
          console.log('마이크 권한 에러 발생, 재시도 중...');
          // 잠시 후 재시도
          setTimeout(() => {
            if (!this.isListening) {
              console.log('STT 재시도');
              this.startListening(onResult, onError).catch(err => {
                console.error('STT 재시도 실패:', err);
              });
            }
          }, 1000);
          return; // 재시도 중이므로 에러 콜백 호출 안 함
        }
        
        // 에러 메시지 매핑
        let errorMessage = '음성 인식 중 오류 발생';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '마이크 권한이 거부됨. 브라우저 주소창의 자물쇠 아이콘을 클릭하여 마이크 권한 허용';
            break;
          case 'no-speech':
            // no-speech는 에러로 처리하지 않음 (계속 대기)
            console.log('음성이 감지되지 않음 (계속 대기 중)');
            return;
          case 'audio-capture':
            errorMessage = '마이크를 찾을 수 없음. 마이크 연결 확인 필요';
            break;
          case 'network':
            errorMessage = '네트워크 오류 발생. 인터넷 연결 확인 필요';
            break;
          default:
            errorMessage = `음성 인식 오류: ${event.error}`;
        }
        
        if (onError) onError(event.error, errorMessage);
      };

      this.recognition.onend = () => {
        console.log('STT 종료');
        this.isListening = false;
        // continuous 모드에서는 자동으로 다시 시작되지 않으므로 수동으로 재시작 필요
      };

      // Speech Recognition 시작
      console.log('Speech Recognition 시작 시도...');
      this.recognition.start();
      this.isListening = true;
      console.log('STT 시작 완료');
    } catch (error) {
      console.error('STT 초기화 에러:', error);
      this.isListening = false;
      if (onError) {
        onError('INIT_ERROR', `음성 인식 초기화 실패: ${error.message}`);
      }
    }
  }

  /**
   * 음성 인식 중지
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('STT 중지');
    }
  }

  /**
   * 음성 인식 일시정지
   */
  pause() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 음성 인식 재개
   */
  resume() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  /**
   * 브라우저 지원 여부 확인
   */
  isSupported() {
    return !!this.SpeechRecognition;
  }
}

// 전역으로 사용 가능하도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STTService;
}

