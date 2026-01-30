/**
 * API 서비스 - 백엔드와의 통신
 */
import axios from 'axios';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const callService = {
  /**
   * AI 대리 통화 시작
   */
  startCall: async (callerNumber, userId = 'user123') => {
    try {
      const response = await api.post('/call/start', {
        caller_number: callerNumber,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  },

  /**
   * 통화 중 음성 데이터 처리
   */
  processAudio: async (callId, audioData) => {
    try {
      const response = await api.post('/call/process-audio', {
        call_id: callId,
        audio_data: audioData,
      });
      return response.data;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  },

  /**
   * 통화 종료 및 리포트 생성
   */
  endCall: async (callId, conversationHistory) => {
    try {
      const response = await api.post('/call/end', {
        call_id: callId,
        conversation_history: conversationHistory,
      });
      return response.data;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  },

  /**
   * 통화 리포트 조회
   */
  getReport: async (callId) => {
    try {
      const response = await api.get(`/call/report/${callId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  },
};

export default api;

