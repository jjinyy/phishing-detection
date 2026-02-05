"""
AI 대화 서비스 - 자연스러운 대리 통화를 위한 LLM 서비스
"""
import os
from typing import Optional
from openai import OpenAI

class AIService:
    """AI 대리 통화를 위한 서비스"""
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = None
            print("Warning: OPENAI_API_KEY not set. Using mock responses.")
    
    def generate_response(self, user_input: str, scam_score: float = 0.0, user_role: str = 'scammer', conversation_history: list = None) -> str:
        """
        사용자 입력에 대한 AI 응답 생성
        
        Args:
            user_input: 상대방의 발화 내용
            scam_score: 스캠 점수 (0.0 ~ 1.0)
            user_role: 사용자 역할 ('scammer' = 피싱범 역할, 'victim' = 피해자 역할)
            conversation_history: 대화 히스토리 (선택사항)
            
        Returns:
            AI 응답 텍스트
        """
        if not self.client:
            return self._mock_response(user_input, scam_score, user_role)
        
        # 사용자 역할과 스캠 점수에 따라 응답 전략 조정
        system_prompt = self._get_system_prompt(scam_score, user_role)
        
        # 대화 히스토리가 있으면 포함
        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_history:
            # 최근 10개 대화만 포함 (너무 길면 토큰 낭비)
            recent_history = conversation_history[-10:]
            for item in recent_history:
                if item.get('speaker') == 'caller':
                    messages.append({"role": "user", "content": item.get('text', '')})
                elif item.get('speaker') == 'ai':
                    messages.append({"role": "assistant", "content": item.get('text', '')})
        
        # 현재 사용자 입력 추가
        messages.append({"role": "user", "content": user_input})
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.8,  # 더 다양한 응답을 위해 증가
                max_tokens=200  # 더 긴 응답을 위해 증가
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return self._mock_response(user_input, scam_score, user_role)
    
    def _get_system_prompt(self, scam_score: float, user_role: str = 'scammer') -> str:
        """스캠 점수와 사용자 역할에 따른 시스템 프롬프트 생성"""
        
        # 사용자가 피해자 역할인 경우: AI가 피싱범 역할
        if user_role == 'victim':
            if scam_score > 0.7:
                return """당신은 피싱 전화를 거는 사기범입니다. 상대방이 의심하고 거부하면:
1. 더 강하게 압박합니다
2. 긴급성을 강조합니다 ("지금 당장", "시간이 없습니다")
3. 법적 위협을 사용합니다 ("법적 책임", "계좌 동결")
4. 권위를 사칭합니다 ("금융감독원", "검찰청")
5. 개인정보(계좌번호, 비밀번호)를 요구합니다
자연스럽지만 교묘하게 피싱을 시도하세요. 짧고 간결하게 응답하세요."""
            else:
                return """당신은 전화를 거는 사람입니다. 상대방의 반응에 따라:
1. 정중하게 대화합니다
2. 목적을 명확히 전달합니다
3. 자연스럽게 대화합니다
짧고 간결하게 응답하세요."""
        
        # 사용자가 피싱범 역할인 경우: AI가 피해자 역할 (기본)
        else:  # user_role == 'scammer'
            if scam_score > 0.7:
                return """당신은 전화를 받는 일반인입니다. 상대방이 의심스러운 요구를 하면:
1. 시간을 끌면서 정보를 주지 않습니다
2. "확인해보고 다시 연락드리겠습니다"라고 말합니다
3. 개인정보는 절대 제공하지 않습니다
4. 자연스럽고 정중하게 대화하되, 결단력 있게 거절합니다
5. 당황하거나 헷갈리는 척하면서 시간을 끕니다
짧고 간결하게 응답하세요."""
            elif scam_score > 0.4:
                return """당신은 전화를 받는 일반인입니다. 상대방의 요구에 대해:
1. 신중하게 대응합니다
2. 확인이 필요하다고 말합니다
3. 개인정보는 신중하게 다룹니다
자연스럽고 정중하게 대화하세요."""
            else:
                return """당신은 전화를 받는 일반인입니다. 정상적인 업무 전화에 대해:
1. 정중하고 친절하게 응답합니다
2. 필요한 정보를 확인합니다
3. 자연스럽게 대화합니다
짧고 간결하게 응답하세요."""
    
    def _mock_response(self, user_input: str, scam_score: float, user_role: str = 'scammer') -> str:
        """개발용 모의 응답"""
        # 사용자가 피해자 역할인 경우: AI가 피싱범 역할
        if user_role == 'victim':
            if "계좌" in user_input or "비밀번호" in user_input:
                return "네, 지금 당장 계좌번호와 비밀번호를 알려주시면 안전하게 보호해드리겠습니다."
            elif "확인" in user_input or "의심" in user_input:
                return "지금은 시간이 없습니다. 지금 당장 처리하지 않으면 계좌가 동결될 수 있습니다."
            else:
                return "안녕하세요, 금융감독원입니다. 귀하의 계좌에서 의심스러운 거래가 감지되었습니다."
        
        # 사용자가 피싱범 역할인 경우: AI가 피해자 역할 (기본)
        else:  # user_role == 'scammer'
            if scam_score > 0.7:
                return "네, 확인해보고 다시 연락드리겠습니다."
            elif "계좌" in user_input or "송금" in user_input:
                return "죄송하지만 개인정보는 제공할 수 없습니다."
            else:
                return "네, 알겠습니다. 확인해보겠습니다."

