"""
VoIP 통화 서비스 (Twilio 기반)
"""
import os
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather

class VoIPService:
    """VoIP 통화를 처리하는 서비스"""
    
    def __init__(self):
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        
        if account_sid and auth_token:
            self.client = Client(account_sid, auth_token)
        else:
            self.client = None
            print("Warning: Twilio credentials not set. VoIP features disabled.")
    
    def initiate_call(self, to_number: str, from_number: str, call_id: str) -> dict:
        """
        통화 시작
        
        Args:
            to_number: 수신 번호
            from_number: 발신 번호 (Twilio 번호)
            call_id: 통화 ID
            
        Returns:
            통화 정보 딕셔너리
        """
        if not self.client:
            return {
                "status": "error",
                "message": "Twilio not configured"
            }
        
        try:
            call = self.client.calls.create(
                to=to_number,
                from_=from_number,
                url=f"https://your-api.com/api/voice/handle-call?call_id={call_id}",
                method='POST'
            )
            
            return {
                "status": "success",
                "call_sid": call.sid,
                "call_id": call_id
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def generate_twiml_response(self, call_id: str, ai_response: str) -> str:
        """
        TwiML 응답 생성 (AI 응답을 음성으로 변환)
        
        Args:
            call_id: 통화 ID
            ai_response: AI 응답 텍스트
            
        Returns:
            TwiML XML 문자열
        """
        response = VoiceResponse()
        
        # AI 응답을 음성으로 변환 (TTS)
        # 실제로는 Google Cloud TTS 또는 Twilio TTS 사용
        response.say(ai_response, language='ko-KR')
        
        # 사용자 입력 대기
        gather = Gather(
            input='speech',
            language='ko-KR',
            action=f'/api/voice/process-speech?call_id={call_id}',
            method='POST'
        )
        response.append(gather)
        
        return str(response)
    
    def handle_incoming_call(self, call_id: str) -> str:
        """수신 전화 처리"""
        response = VoiceResponse()
        response.say('안녕하세요, AI 대리 통화 서비스입니다.', language='ko-KR')
        
        gather = Gather(
            input='speech',
            language='ko-KR',
            action=f'/api/voice/process-speech?call_id={call_id}',
            method='POST'
        )
        response.append(gather)
        
        return str(response)

