/**
 * 음성 통화 처리 핸들러
 * STT와 TTS를 연결하여 실제 음성 통화를 처리
 */
class VoiceCallHandler {
  constructor(callService) {
    this.stt = new STTService();
    this.tts = new TTSService();
    this.callService = callService;
    
    this.callId = null;
    this.conversationHistory = [];
    this.scamScore = 0;
    this.isCallActive = false;
    this.userRole = 'scammer'; // 사용자 역할: 'scammer' (피싱범) 또는 'victim' (피해자)
    
    // 콜백 함수들
    this.onConversationUpdate = null;
    this.onScamScoreUpdate = null;
    this.onError = null;
  }

  /**
   * 통화 시작
   * @param {string} callerNumber - 발신자 번호
   * @param {Object} callbacks - 콜백 함수들
   * @param {string} userRole - 사용자 역할 ('scammer' 또는 'victim')
   */
  async startCall(callerNumber, callbacks = {}, userRole = 'scammer') {
    try {
      this.userRole = userRole; // 사용자 역할 저장
      this.onConversationUpdate = callbacks.onConversationUpdate;
      this.onScamScoreUpdate = callbacks.onScamScoreUpdate;
      this.onError = callbacks.onError;

      // 1. 백엔드에 통화 시작 알림
      const response = await this.callService.startCall(callerNumber);
      this.callId = response.call_id;
      this.isCallActive = true;

      console.log('통화 시작:', this.callId);

      // 2. STT 시작 (상대방 음성 듣기)
      if (this.stt.isSupported()) {
        // STT 시작 (비동기)
        this.stt.startListening(
          (text) => this.handleCallerSpeech(text),
          (error, errorMessage) => this.handleSTTError(error, errorMessage)
        ).catch(error => {
          console.error('STT 시작 실패:', error);
          if (this.onError) {
            this.onError('STT_START_FAILED', `음성 인식 시작 실패: ${error.message}`);
          }
        });
      } else {
        console.warn('STT가 지원되지 않습니다. 텍스트 입력 모드로 전환하세요.');
        if (this.onError) {
          this.onError('STT_NOT_SUPPORTED', '음성 인식이 지원되지 않는 브라우저입니다.');
        }
      }

      // 3. AI 인사말 재생 (선택사항)
      // this.tts.speak('안녕하세요, 무엇을 도와드릴까요?');

    } catch (error) {
      console.error('통화 시작 실패:', error);
      if (this.onError) {
        this.onError('START_CALL_FAILED', error.message);
      }
    }
  }

  /**
   * 상대방 음성 처리
   * @param {string} text - STT로 변환된 텍스트
   */
  async handleCallerSpeech(text) {
    if (!this.isCallActive) return;

    try {
      console.log('상대방 말:', text);

      // 1. 상대방 말을 대화 내역에 추가
      const callerMessage = {
        speaker: 'caller',
        text: text,
        timestamp: new Date().toISOString()
      };
      
      this.conversationHistory.push(callerMessage);
      
      // UI 업데이트 콜백
      if (this.onConversationUpdate) {
        this.onConversationUpdate([...this.conversationHistory]);
      }

      // 2. 백엔드로 전송하여 AI 응답 생성
      // 주의: 실제 오디오가 아닌 텍스트를 전송
      // 대화 히스토리도 함께 전달하여 유동적인 대화 가능하도록 함
      const response = await this.callService.processAudio(
        this.callId, 
        text, 
        this.userRole,
        this.conversationHistory  // 현재까지의 대화 히스토리 전달
      );

      // 3. AI 응답을 대화 내역에 추가
      const aiMessage = {
        speaker: 'ai',
        text: response.ai_response || response.transcript || '응답을 생성하지 못했습니다.',
        timestamp: new Date().toISOString()
      };
      
      this.conversationHistory.push(aiMessage);
      
      // UI 업데이트 콜백
      if (this.onConversationUpdate) {
        this.onConversationUpdate([...this.conversationHistory]);
      }

      // 4. 스캠 점수 업데이트
      if (response.scam_score !== undefined) {
        this.scamScore = response.scam_score;
        if (this.onScamScoreUpdate) {
          this.onScamScoreUpdate(this.scamScore);
        }
      }

      // 5. AI 응답을 음성으로 재생
      if (this.tts.isSupported() && aiMessage.text) {
        this.tts.speak(aiMessage.text, {
          lang: 'ko-KR',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0
        }, () => {
          // 재생 완료 후 STT는 계속 대기 중
          console.log('AI 응답 재생 완료');
        });
      }

    } catch (error) {
      console.error('음성 처리 실패:', error);
      if (this.onError) {
        this.onError('PROCESS_SPEECH_FAILED', error.message);
      }
    }
  }

  /**
   * STT 에러 처리
   * @param {string} error - 에러 코드
   * @param {string} errorMessage - 에러 메시지
   */
  handleSTTError(error, errorMessage) {
    console.error('STT 에러:', error, errorMessage);
    
    // 일부 에러는 무시 가능
    const ignorableErrors = ['no-speech'];
    if (ignorableErrors.includes(error)) {
      console.log('STT 에러 무시:', error);
      return;
    }

    // 심각한 에러는 콜백 호출
    if (this.onError) {
      this.onError('STT_ERROR', errorMessage || error);
    }
  }

  /**
   * 통화 종료
   */
  async endCall() {
    try {
      this.isCallActive = false;

      // 1. STT 중지
      this.stt.stopListening();

      // 2. TTS 중지
      this.tts.stop();

      // 3. 백엔드에 통화 종료 알림 및 리포트 생성
      if (this.callId) {
        const response = await this.callService.endCall(
          this.callId,
          this.conversationHistory
        );
        
        return response;
      }

      return null;
    } catch (error) {
      console.error('통화 종료 실패:', error);
      throw error;
    }
  }

  /**
   * 통화 일시정지
   */
  pauseCall() {
    this.stt.pause();
    this.tts.pause();
  }

  /**
   * 통화 재개
   */
  resumeCall() {
    this.stt.resume();
    this.tts.resume();
  }

  /**
   * 현재 통화 상태 확인
   */
  isActive() {
    return this.isCallActive;
  }

  /**
   * 대화 내역 가져오기
   */
  getConversationHistory() {
    return [...this.conversationHistory];
  }

  /**
   * 현재 스캠 점수 가져오기
   */
  getScamScore() {
    return this.scamScore;
  }
}

// 전역으로 사용 가능하도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceCallHandler;
}

