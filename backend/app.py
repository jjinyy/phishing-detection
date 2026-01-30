"""
5분 방패 AI - 백엔드 메인 애플리케이션
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from config import config
from services.ai_service import AIService
from services.scam_analyzer import ScamAnalyzer
from services.stt_service import STTService

load_dotenv()

app = Flask(__name__)

# 환경별 설정 로드
env = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[env])

# CORS 설정 - 개발 환경에서는 모든 origin 허용
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

# 서비스 초기화
ai_service = AIService()
scam_analyzer = ScamAnalyzer()
stt_service = STTService()

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({"status": "healthy", "service": "5분 방패 AI"}), 200

@app.route('/api/call/start', methods=['POST'])
def start_call():
    """
    AI 대리 통화 시작
    요청: { "caller_number": "010-1234-5678", "user_id": "user123" }
    응답: { "call_id": "call_123", "status": "started" }
    """
    try:
        data = request.json
        caller_number = data.get('caller_number')
        user_id = data.get('user_id')
        
        if not caller_number:
            return jsonify({"error": "caller_number is required"}), 400
        
        # 통화 세션 생성
        call_id = f"call_{user_id}_{caller_number.replace('-', '')}"
        
        return jsonify({
            "call_id": call_id,
            "status": "started",
            "max_duration": 300,  # 5분 (초 단위)
            "message": "AI 대리 통화가 시작되었습니다."
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/call/process-audio', methods=['POST'])
def process_audio():
    """
    통화 중 음성 데이터 처리
    요청: { 
        "call_id": "call_123", 
        "audio_data": "전사된 텍스트", 
        "user_role": "scammer",
        "conversation_history": [...]  # 선택사항: 대화 히스토리
    }
    응답: { "transcript": "전사된 텍스트", "ai_response": "AI 응답", "scam_score": 0.7 }
    """
    try:
        data = request.json
        call_id = data.get('call_id')
        audio_data = data.get('audio_data')  # 실제로는 텍스트
        user_role = data.get('user_role', 'scammer')  # 기본값: 피싱범 역할
        conversation_history = data.get('conversation_history', [])  # 대화 히스토리
        
        if not call_id or not audio_data:
            return jsonify({"error": "call_id and audio_data are required"}), 400
        
        # STT는 프론트엔드에서 처리되므로 텍스트 그대로 사용
        transcript = audio_data
        
        # 스캠 점수 계산 (사용자가 피싱범 역할일 때만)
        scam_score = 0.0
        if user_role == 'scammer':
            scam_score = scam_analyzer.analyze(transcript)
        # 사용자가 피해자 역할이면 스캠 점수는 0 (AI가 피싱을 시도하므로)
        
        # AI 응답 생성 (역할과 대화 히스토리에 따라)
        ai_response = ai_service.generate_response(
            transcript, 
            scam_score, 
            user_role,
            conversation_history  # 대화 히스토리 전달
        )
        
        return jsonify({
            "call_id": call_id,
            "transcript": transcript,
            "ai_response": ai_response,
            "scam_score": scam_score,
            "status": "ongoing"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/call/end', methods=['POST'])
def end_call():
    """
    통화 종료 및 리포트 생성
    요청: { "call_id": "call_123", "conversation_history": [...] }
    응답: { "report": {...} }
    """
    try:
        data = request.json
        call_id = data.get('call_id')
        conversation_history = data.get('conversation_history', [])
        
        if not call_id:
            return jsonify({"error": "call_id is required"}), 400
        
        # 전체 대화 분석
        report = scam_analyzer.generate_report(conversation_history)
        
        return jsonify({
            "call_id": call_id,
            "status": "ended",
            "report": report
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/call/report/<call_id>', methods=['GET'])
def get_report(call_id):
    """통화 리포트 조회"""
    # 실제로는 데이터베이스에서 조회하지만, 여기서는 예시만 제공
    return jsonify({
        "call_id": call_id,
        "message": "리포트는 통화 종료 시 생성됩니다."
    }), 200

if __name__ == '__main__':
    port = app.config['PORT']
    debug = app.config['DEBUG']
    app.run(host='0.0.0.0', port=port, debug=debug)

