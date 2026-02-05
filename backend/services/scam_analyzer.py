"""
스캠 패턴 분석 서비스
"""
import re
from typing import List, Dict, Any
from datetime import datetime

class ScamAnalyzer:
    """피싱/스캠 패턴 분석 서비스"""
    
    def __init__(self):
        # 스캠 키워드 패턴
        self.scam_keywords = {
            'authority_impersonation': [
                '검찰청', '경찰청', '법원', '국세청', '금융감독원',
                '검사', '경찰', '법원', '공무원'
            ],
            'urgency_pressure': [
                '지금 바로', '즉시', '긴급', '당장', '지금 당장',
                '시간 없습니다', '늦으면', '마감', '오늘 안에'
            ],
            'account_request': [
                '계좌번호', '계좌', '송금', '이체', '입금',
                '안전계좌', '보호계좌', '임시계좌'
            ],
            'personal_info_request': [
                '주민등록번호', '주민번호', '신분증', '비밀번호',
                '카드번호', '카드 비밀번호', 'OTP', '인증번호'
            ],
            'threat': [
                '체포', '구속', '수사', '소환', '압수수색',
                '계좌 동결', '자산 압류', '법적 조치'
            ]
        }
        
        # 스캠 유형별 가중치
        self.scam_weights = {
            'authority_impersonation': 0.3,
            'urgency_pressure': 0.2,
            'account_request': 0.25,
            'personal_info_request': 0.3,
            'threat': 0.35
        }
    
    def analyze(self, text: str) -> float:
        """
        텍스트의 스캠 점수 계산 (0.0 ~ 1.0)
        
        Args:
            text: 분석할 텍스트
            
        Returns:
            스캠 점수 (0.0 = 정상, 1.0 = 확실한 스캠)
        """
        if not text:
            return 0.0
        
        text_lower = text.lower()
        total_score = 0.0
        detected_patterns = []
        
        # 각 스캠 패턴 검사
        for pattern_type, keywords in self.scam_keywords.items():
            pattern_score = 0.0
            matched_keywords = []
            
            for keyword in keywords:
                if keyword in text_lower:
                    pattern_score += 0.1
                    matched_keywords.append(keyword)
            
            if pattern_score > 0:
                weighted_score = min(pattern_score, 1.0) * self.scam_weights[pattern_type]
                total_score += weighted_score
                detected_patterns.append({
                    'type': pattern_type,
                    'keywords': matched_keywords,
                    'score': weighted_score
                })
        
        # 최종 점수는 0.0 ~ 1.0 사이로 정규화
        final_score = min(total_score, 1.0)
        
        return round(final_score, 2)
    
    def generate_report(self, conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        통화 종료 후 리포트 생성
        
        Args:
            conversation_history: 대화 기록 리스트
                예: [{"speaker": "caller", "text": "...", "timestamp": "..."}, ...]
                
        Returns:
            리포트 딕셔너리
        """
        if not conversation_history:
            return self._empty_report()
        
        # 전체 대화 텍스트 합치기
        full_text = " ".join([item.get('text', '') for item in conversation_history])
        
        # 스캠 점수 계산
        scam_score = self.analyze(full_text)
        
        # 스캠 유형 분류
        scam_types = self._classify_scam_type(full_text)
        
        # 판별 결과 결정
        if scam_score >= 0.7:
            result = "피싱 확정"
            risk_level = "high"
        elif scam_score >= 0.4:
            result = "의심"
            risk_level = "medium"
        else:
            result = "정상"
            risk_level = "low"
        
        # 근거 요약 생성
        evidence = self._generate_evidence(full_text, scam_types)
        
        # 권장 행동 가이드 생성
        action_guide = self._generate_action_guide(result, scam_types)
        
        return {
            "result": result,
            "risk_level": risk_level,
            "scam_score": scam_score,
            "scam_types": scam_types,
            "evidence": evidence,
            "action_guide": action_guide,
            "conversation_summary": self._summarize_conversation(conversation_history),
            "timestamp": datetime.now().isoformat()
        }
    
    def _classify_scam_type(self, text: str) -> List[str]:
        """스캠 유형 분류"""
        text_lower = text.lower()
        detected_types = []
        
        type_names = {
            'authority_impersonation': '기관 사칭',
            'urgency_pressure': '긴급성 압박',
            'account_request': '계좌 요구',
            'personal_info_request': '개인정보 요구',
            'threat': '위협/협박'
        }
        
        for pattern_type, keywords in self.scam_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_types.append(type_names.get(pattern_type, pattern_type))
        
        return detected_types if detected_types else ['기타']
    
    def _generate_evidence(self, text: str, scam_types: List[str]) -> List[str]:
        """판단 근거 요약 (3줄)"""
        evidence = []
        
        if '기관 사칭' in scam_types:
            evidence.append("공공기관을 사칭하는 표현이 사용되었습니다.")
        
        if '계좌 요구' in scam_types:
            evidence.append("계좌번호나 송금을 요구하는 내용이 포함되어 있습니다.")
        
        if '긴급성 압박' in scam_types:
            evidence.append("즉시 대응을 강요하는 긴급성 압박이 감지되었습니다.")
        
        if '위협/협박' in scam_types:
            evidence.append("체포, 구속 등 위협적인 표현이 사용되었습니다.")
        
        # 3줄로 제한
        return evidence[:3] if evidence else ["특별한 이상 징후가 감지되지 않았습니다."]
    
    def _generate_action_guide(self, result: str, scam_types: List[str]) -> List[str]:
        """권장 행동 가이드 생성"""
        if result == "피싱 확정":
            return [
                "다시 전화하지 마세요.",
                "공식 기관 번호로 직접 확인하세요.",
                "계좌 정보나 개인정보를 제공하지 마세요.",
                "의심스러운 경우 경찰청(112)이나 금융감독원(1332)에 신고하세요."
            ]
        elif result == "의심":
            return [
                "신중하게 판단하세요.",
                "공식 채널을 통해 확인하세요.",
                "개인정보나 금융정보는 제공하지 마세요."
            ]
        else:
            return [
                "정상적인 통화로 보입니다.",
                "필요시 공식 채널로 재확인하세요."
            ]
    
    def _summarize_conversation(self, conversation_history: List[Dict[str, Any]]) -> str:
        """대화 요약"""
        if len(conversation_history) <= 3:
            return "짧은 대화가 진행되었습니다."
        
        caller_turns = [item for item in conversation_history if item.get('speaker') == 'caller']
        ai_turns = [item for item in conversation_history if item.get('speaker') == 'ai']
        
        return f"총 {len(conversation_history)}턴의 대화가 진행되었습니다. (상대방: {len(caller_turns)}턴, AI: {len(ai_turns)}턴)"
    
    def _empty_report(self) -> Dict[str, Any]:
        """빈 리포트 반환"""
        return {
            "result": "분석 불가",
            "risk_level": "unknown",
            "scam_score": 0.0,
            "scam_types": [],
            "evidence": ["대화 내용이 없습니다."],
            "action_guide": ["통화를 다시 시도해주세요."],
            "conversation_summary": "대화 기록이 없습니다.",
            "timestamp": datetime.now().isoformat()
        }

