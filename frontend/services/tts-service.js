/**
 * Text-to-Speech 서비스 (Web Speech API 사용)
 */
class TTSService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  /**
   * 텍스트를 음성으로 변환하여 재생
   * @param {string} text - 읽을 텍스트
   * @param {Object} options - 옵션
   * @param {Function} onEnd - 재생 완료 콜백
   */
  speak(text, options = {}, onEnd = null) {
    if (!this.synthesis) {
      console.error('Speech Synthesis API not supported in this browser');
      return;
    }

    if (!text || text.trim() === '') {
      console.warn('TTS: 빈 텍스트');
      return;
    }

    // 이전 음성 중지
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 옵션 설정
    utterance.lang = options.lang || 'ko-KR'; // 언어
    utterance.rate = options.rate || 1.0; // 속도 (0.1 ~ 10)
    utterance.pitch = options.pitch || 1.0; // 음높이 (0 ~ 2)
    utterance.volume = options.volume !== undefined ? options.volume : 1.0; // 볼륨 (0 ~ 1)

    // 이벤트 핸들러
    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('TTS 시작:', text.substring(0, 30) + '...');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('TTS 완료');
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.error('TTS 에러:', event.error);
    };

    utterance.onpause = () => {
      console.log('TTS 일시정지');
    };

    utterance.onresume = () => {
      console.log('TTS 재개');
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  /**
   * 음성 재생 중지
   */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * 음성 재생 일시정지
   */
  pause() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * 음성 재생 재개
   */
  resume() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.resume();
    }
  }

  /**
   * 현재 재생 중인지 확인
   */
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }

  /**
   * 사용 가능한 음성 목록 가져오기
   */
  getVoices() {
    return new Promise((resolve) => {
      let voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // 음성 목록이 아직 로드되지 않았을 수 있음
        this.synthesis.onvoiceschanged = () => {
          voices = this.synthesis.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * 한국어 음성 찾기
   */
  async findKoreanVoice() {
    const voices = await this.getVoices();
    // 한국어 음성 우선 찾기
    const koreanVoice = voices.find(v => v.lang.startsWith('ko'));
    return koreanVoice || voices[0]; // 없으면 첫 번째 음성 사용
  }

  /**
   * 브라우저 지원 여부 확인
   */
  isSupported() {
    return !!this.synthesis;
  }
}

// 전역으로 사용 가능하도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TTSService;
}

