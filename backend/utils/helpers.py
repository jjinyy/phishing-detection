"""
유틸리티 헬퍼 함수
"""
import re
from typing import Optional

def normalize_phone_number(phone: str) -> str:
    """
    전화번호 정규화 (하이픈 제거 등)
    
    Args:
        phone: 전화번호 문자열
        
    Returns:
        정규화된 전화번호
    """
    # 하이픈, 공백, 괄호 제거
    normalized = re.sub(r'[-\s()]', '', phone)
    return normalized

def generate_fake_info(info_type: str) -> str:
    """
    가짜 정보 생성 (개인정보 보호용)
    
    Args:
        info_type: 정보 유형 ('account', 'name', 'id_number' 등)
        
    Returns:
        가짜 정보 문자열
    """
    fake_data = {
        'account': '110-123-456789',
        'name': '홍길동',
        'id_number': '123456-1234567',
        'phone': '010-1234-5678',
    }
    
    return fake_data.get(info_type, '정보 없음')

def format_duration(seconds: int) -> str:
    """
    초를 분:초 형식으로 변환
    
    Args:
        seconds: 초 단위 시간
        
    Returns:
        "MM:SS" 형식 문자열
    """
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins}:{secs:02d}"





