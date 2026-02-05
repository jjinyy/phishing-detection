// 5분 방패 AI - 웹앱 메인 (전체 기능 포함)
const { useState, useEffect, useRef } = React;

// 스타일 병합 헬퍼 함수
const mergeStyles = (...styleObjects) => {
  const result = {};
  styleObjects.forEach(style => {
    if (style && typeof style === 'object') {
      Object.keys(style).forEach(key => {
        result[key] = style[key];
      });
    }
  });
  return result;
};

// API 기본 URL (자동 IP 감지)
// 배포 환경에 따라 백엔드 서버 URL 설정
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // 프로덕션 환경: Render 백엔드 URL 사용
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://phishing-detection-34g2.onrender.com/api';
  }
  
  // 로컬 개발 환경
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// 로컬 스토리지 관리
const storage = {
  getHistory: () => {
    try {
      const data = localStorage.getItem('callHistory');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  saveHistory: (history) => {
    try {
      localStorage.setItem('callHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  },
  addCall: (callData) => {
    const history = storage.getHistory();
    history.unshift({
      id: Date.now().toString(),
      ...callData,
      createdAt: new Date().toISOString()
    });
    storage.saveHistory(history);
    return history;
  },
  updateComment: (callId, comment) => {
    const history = storage.getHistory();
    const index = history.findIndex(h => h.id === callId);
    if (index !== -1) {
      history[index].userComment = comment;
      storage.saveHistory(history);
    }
    return history;
  },
  // 차단 목록 관리
  getBlockList: () => {
    try {
      const data = localStorage.getItem('blockList');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  saveBlockList: (blockList) => {
    try {
      localStorage.setItem('blockList', JSON.stringify(blockList));
    } catch (e) {
      console.error('Failed to save block list:', e);
    }
  },
  addBlock: (number, reason = '') => {
    const blockList = storage.getBlockList();
    // 중복 체크
    if (!blockList.find(b => b.number === number)) {
      blockList.unshift({
        id: Date.now().toString(),
        number: number,
        reason: reason,
        createdAt: new Date().toISOString()
      });
      storage.saveBlockList(blockList);
    }
    return blockList;
  },
  removeBlock: (blockId) => {
    const blockList = storage.getBlockList();
    const filtered = blockList.filter(b => b.id !== blockId);
    storage.saveBlockList(filtered);
    return filtered;
  },
  isBlocked: (number) => {
    const blockList = storage.getBlockList();
    return blockList.some(b => b.number === number);
  }
};

// API 호출 함수
const callService = {
  startCall: async (callerNumber, userId = 'user123') => {
    try {
      const response = await fetch(`${API_BASE_URL}/call/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_number: callerNumber, user_id: userId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error starting call:', error);
      return {
        call_id: `call_${Date.now()}`,
        status: 'started',
        max_duration: 300
      };
    }
  },
  processAudio: async (callId, text, userRole) => {
    // STT는 프론트엔드에서 처리되므로 텍스트를 그대로 전송
    try {
      const response = await fetch(`${API_BASE_URL}/call/process-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callId, audio_data: text, user_role: userRole })
      });
      return await response.json();
    } catch (error) {
      console.error('Error processing audio:', error);
      // 오프라인 모드: 기본 응답 반환
      return {
        transcript: text,
        ai_response: '네, 알겠습니다. 확인해보겠습니다.',
        scam_score: 0.1
      };
    }
  },
  endCall: async (callId, conversationHistory) => {
    try {
      const response = await fetch(`${API_BASE_URL}/call/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callId, conversation_history: conversationHistory || [] })
      });
      const data = await response.json();
      // 리포트가 없으면 기본 리포트 반환 (정교한 분석)
      if (!data.report) {
        const callerMessages = conversationHistory ? conversationHistory.filter(h => h.speaker === 'caller' && h.text) : [];
        const hasAccountRequest = callerMessages.some(m => m.text.includes('계좌번호') || m.text.includes('비밀번호'));
        const hasUrgency = callerMessages.some(m => m.text.includes('지금 당장') || m.text.includes('서두르') || m.text.includes('시간이 없'));
        const hasThreat = callerMessages.some(m => m.text.includes('법적 책임') || m.text.includes('동결') || m.text.includes('책임 못'));
        const hasAuthority = callerMessages.some(m => m.text.includes('금융감독원') || m.text.includes('검찰') || m.text.includes('경찰'));
        
        let scamScore = 0.5;
        const scamTypes = [];
        const evidence = [];
        
        if (hasAuthority) {
          scamScore = Math.min(scamScore + 0.2, 0.95);
          scamTypes.push('기관 사칭');
          evidence.push('공공기관(금융감독원, 검찰청 등)을 사칭하는 표현이 사용되었습니다.');
        }
        if (hasAccountRequest) {
          scamScore = Math.min(scamScore + 0.25, 0.95);
          scamTypes.push('개인정보 요구');
          evidence.push('계좌번호, 비밀번호 등 민감한 개인정보를 요구하는 내용이 포함되어 있습니다.');
        }
        if (hasUrgency) {
          scamScore = Math.min(scamScore + 0.15, 0.95);
          scamTypes.push('긴급성 압박');
          evidence.push('"지금 당장", "서두르세요" 등 긴급성을 조성하는 표현이 반복적으로 사용되었습니다.');
        }
        if (hasThreat) {
          scamScore = Math.min(scamScore + 0.2, 0.95);
          scamTypes.push('법적 위협');
          evidence.push('법적 책임, 계좌 동결 등 위협적인 표현을 사용하여 심리적 압박을 시도했습니다.');
        }
        
        const result = scamScore > 0.8 ? '피싱 확정' : scamScore > 0.6 ? '의심' : '정상';
        
        return {
          report: {
            result: result,
            risk_level: scamScore > 0.7 ? 'high' : scamScore > 0.5 ? 'medium' : 'low',
            scam_score: scamScore,
            scam_types: scamTypes.length > 0 ? scamTypes : ['의심'],
            evidence: evidence.length > 0 ? evidence : ['통화 내용을 분석한 결과 의심스러운 패턴이 발견되었습니다.'],
            action_guide: [
              '다시 전화하지 마세요.',
              '공식 기관 번호(금융감독원: 1332, 경찰청: 112)로 직접 확인하세요.',
              '절대 계좌번호, 비밀번호, 인증번호를 알려주지 마세요.',
              '의심스러운 통화는 녹음하고 신고하세요.'
            ],
            conversation_summary: `총 ${conversationHistory ? conversationHistory.length : 0}턴의 대화가 진행되었습니다.`
          }
        };
      }
      return data;
    } catch (error) {
      console.error('Error ending call:', error);
      // 오프라인 모드: 정교한 분석으로 기본 리포트 생성
      const callerMessages = conversationHistory ? conversationHistory.filter(h => h.speaker === 'caller' && h.text) : [];
      const hasAccountRequest = callerMessages.some(m => m.text.includes('계좌번호') || m.text.includes('비밀번호'));
      const hasUrgency = callerMessages.some(m => m.text.includes('지금 당장') || m.text.includes('서두르') || m.text.includes('시간이 없'));
      const hasThreat = callerMessages.some(m => m.text.includes('법적 책임') || m.text.includes('동결') || m.text.includes('책임 못'));
      const hasAuthority = callerMessages.some(m => m.text.includes('금융감독원') || m.text.includes('검찰') || m.text.includes('경찰'));
      
      let scamScore = 0.5;
      const scamTypes = [];
      const evidence = [];
      
      if (hasAuthority) {
        scamScore = Math.min(scamScore + 0.2, 0.95);
        scamTypes.push('기관 사칭');
        evidence.push('공공기관(금융감독원, 검찰청 등)을 사칭하는 표현이 사용되었습니다.');
      }
      if (hasAccountRequest) {
        scamScore = Math.min(scamScore + 0.25, 0.95);
        scamTypes.push('개인정보 요구');
        evidence.push('계좌번호, 비밀번호 등 민감한 개인정보를 요구하는 내용이 포함되어 있습니다.');
      }
      if (hasUrgency) {
        scamScore = Math.min(scamScore + 0.15, 0.95);
        scamTypes.push('긴급성 압박');
        evidence.push('"지금 당장", "서두르세요" 등 긴급성을 조성하는 표현이 반복적으로 사용되었습니다.');
      }
      if (hasThreat) {
        scamScore = Math.min(scamScore + 0.2, 0.95);
        scamTypes.push('법적 위협');
        evidence.push('법적 책임, 계좌 동결 등 위협적인 표현을 사용하여 심리적 압박을 시도했습니다.');
      }
      
      const result = scamScore > 0.8 ? '피싱 확정' : scamScore > 0.6 ? '의심' : '정상';
      
      return {
        report: {
          result: result,
          risk_level: scamScore > 0.7 ? 'high' : scamScore > 0.5 ? 'medium' : 'low',
          scam_score: scamScore,
          scam_types: scamTypes.length > 0 ? scamTypes : ['의심'],
          evidence: evidence.length > 0 ? evidence : ['통화 내용을 분석한 결과 의심스러운 패턴이 발견되었습니다.'],
          action_guide: [
            '다시 전화하지 마세요.',
            '공식 기관 번호(금융감독원: 1332, 경찰청: 112)로 직접 확인하세요.',
            '절대 계좌번호, 비밀번호, 인증번호를 알려주지 마세요.',
            '의심스러운 통화는 녹음하고 신고하세요.'
          ],
          conversation_summary: `총 ${conversationHistory ? conversationHistory.length : 0}턴의 대화가 진행되었습니다.`
        }
      };
    }
  }
};

// 네비게이션 바
function NavBar({ currentScreen, onNavigate }) {
  return (
    <nav style={styles.navBar}>
      <div style={styles.navContent}>
        <div style={styles.navBrand} onClick={() => onNavigate('home')}>
          <span style={styles.navTitle}>5분 방패 AI</span>
        </div>
        <div style={styles.navMenu}>
          <button
            style={mergeStyles(styles.navButton, currentScreen === 'home' && styles.navButtonActive)}
            onClick={() => onNavigate('home')}
          >
            홈
          </button>
          <button
            style={mergeStyles(styles.navButton, currentScreen === 'history' && styles.navButtonActive)}
            onClick={() => onNavigate('history')}
          >
            히스토리
          </button>
          <button
            style={mergeStyles(styles.navButton, currentScreen === 'settings' && styles.navButtonActive)}
            onClick={() => onNavigate('settings')}
          >
            설정
          </button>
        </div>
      </div>
    </nav>
  );
}

// 홈 화면
function HomeScreen({ onIncomingCall, onNavigate }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>5분 방패 AI</h1>
        <p style={styles.subtitle}>사기범과 나 사이에 서는 AI 통화 보호막</p>
      </div>
      <div style={styles.content}>
        {/* 메인 액션 카드 */}
        <div style={styles.mainActionCard} onClick={() => onIncomingCall('010-1234-5678')}>
          <div style={styles.mainActionContent}>
            <div style={styles.mainActionText}>
              <h2 style={styles.mainActionTitle}>전화가 왔어요</h2>
              <p style={styles.mainActionSubtitle}>AI가 대신 받아서 분석해드릴게요</p>
            </div>
            <div style={styles.mainActionIcon}>📞</div>
          </div>
        </div>

        {/* 주요 서비스 카드 그리드 */}
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>🛡️</div>
            <h3 style={styles.serviceTitle}>AI 대리 통화</h3>
            <p style={styles.serviceDesc}>최대 5분간 대신 통화</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>🔍</div>
            <h3 style={styles.serviceTitle}>실시간 분석</h3>
            <p style={styles.serviceDesc}>스캠 패턴 즉시 감지</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>📊</div>
            <h3 style={styles.serviceTitle}>결과 리포트</h3>
            <p style={styles.serviceDesc}>상세 분석 결과 제공</p>
          </div>
          <div style={styles.serviceCard} onClick={() => onNavigate && onNavigate('history')}>
            <div style={styles.serviceIcon}>📋</div>
            <h3 style={styles.serviceTitle}>히스토리</h3>
            <p style={styles.serviceDesc}>통화 기록 관리</p>
          </div>
          <div style={styles.serviceCard} onClick={() => onNavigate && onNavigate('blocklist')}>
            <div style={styles.serviceIcon}>🚫</div>
            <h3 style={styles.serviceTitle}>차단 목록</h3>
            <p style={styles.serviceDesc}>의심 번호 차단 관리</p>
          </div>
          <div style={styles.serviceCard} onClick={() => alert('112(경찰청) 또는 1332(금융감독원)로 신고하세요.')}>
            <div style={styles.serviceIcon}>🚨</div>
            <h3 style={styles.serviceTitle}>신고하기</h3>
            <p style={styles.serviceDesc}>피싱 번호 신고</p>
          </div>
        </div>

        {/* 안내 섹션 */}
        <div style={styles.infoCard}>
          <div style={styles.infoHeader}>
            <h3 style={styles.infoCardTitle}>서비스 안내</h3>
            <button style={styles.infoButton}>i</button>
          </div>
          <p style={styles.infoCardText}>
            낯선 전화가 오면 제가 대신 받아볼게요!<br/>
            최대 5분간 통화를 분석해서 안전한지 확인해드릴게요.
          </p>
        </div>
      </div>
    </div>
  );
}

// 전화 수신 화면
function IncomingCallScreen({ callerNumber, onEndCall, onReport }) {
  // 차단된 번호 확인
  useEffect(() => {
    if (storage.isBlocked(callerNumber)) {
      if (confirm(`${callerNumber}은(는) 차단된 번호입니다.\n통화를 거절하시겠습니까?`)) {
        onEndCall();
      }
    }
  }, [callerNumber, onEndCall]);

  const [callStatus, setCallStatus] = useState('incoming');
  const [callId, setCallId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scamScore, setScamScore] = useState(0); // 초기값 0%
  // 음성 모드만 사용 (시뮬레이션 모드 제거)
  const [useVoiceMode, setUseVoiceMode] = useState(true); // 음성 모드 사용 여부 (기본값: true)
  const [userRole, setUserRole] = useState('scammer'); // 사용자 역할: 'scammer' (피싱범) 또는 'victim' (피해자)
  
  // 최신 값을 보장하기 위한 ref 사용
  const conversationHistoryRef = useRef([]);
  const scamScoreRef = useRef(0);
  
  // STT/TTS 서비스 (음성 모드 사용 시)
  const voiceCallHandlerRef = useRef(null);
  
  // 피싱 의심 요인 정의 및 가중치
  const phishingFactors = {
    // 기관 사칭 (중요도: 높음)
    authorityImpersonation: {
      keywords: ['금융감독원', '검찰', '경찰', '국세청', '법원', '공공기관'],
      weight: 0.15, // 15% 증가
      description: '공공기관을 사칭하는 표현'
    },
    // 긴급성 압박 (중요도: 중간)
    urgencyPressure: {
      keywords: ['지금 당장', '서두르', '시간이 없', '안전조치', '즉시', '지금 바로', '급합니다'],
      weight: 0.12, // 12% 증가
      description: '긴급성을 조성하는 표현'
    },
    // 개인정보 요구 (중요도: 매우 높음)
    personalInfoRequest: {
      keywords: ['계좌번호', '비밀번호', '개인정보', '주민등록번호', '카드번호', 'OTP', '인증번호'],
      weight: 0.20, // 20% 증가
      description: '민감한 개인정보 요구'
    },
    // 법적 위협 (중요도: 높음)
    legalThreat: {
      keywords: ['법적 책임', '동결', '책임 못', '소송', '고발', '수사', '압수수색'],
      weight: 0.18, // 18% 증가
      description: '법적 위협을 통한 압박'
    },
    // 송금/이체 요구 (중요도: 매우 높음)
    transferRequest: {
      keywords: ['송금', '이체', '보내', '입금', '계좌로', '돈을'],
      weight: 0.22, // 22% 증가
      description: '송금 또는 이체 요구'
    },
    // 비정상적인 접근 방식 (중요도: 중간)
    suspiciousApproach: {
      keywords: ['특별 절차', '비공개', '비밀', '내부', '긴급상황', '특별'],
      weight: 0.10, // 10% 증가
      description: '비정상적인 접근 방식'
    }
  };
  
  // 메시지에서 피싱 패턴 분석 함수
  const analyzePhishingPatterns = (message) => {
    const detectedPatterns = [];
    let totalWeight = 0;
    
    // 각 피싱 요인별로 검사
    Object.keys(phishingFactors).forEach(factorKey => {
      const factor = phishingFactors[factorKey];
      const hasPattern = factor.keywords.some(keyword => message.includes(keyword));
      
      if (hasPattern) {
        detectedPatterns.push({
          type: factorKey,
          description: factor.description,
          weight: factor.weight
        });
        totalWeight += factor.weight;
      }
    });
    
    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
      totalWeight: Math.min(totalWeight, 0.95) // 최대 95%까지
    };
  };
  
  // conversationHistory 변경 시 ref 업데이트
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  // scamScore 변경 시 ref 업데이트
  useEffect(() => {
    scamScoreRef.current = scamScore;
  }, [scamScore]);

  const handleAIAccept = async () => {
    try {
      setCallStatus('ai_talking');
      const response = await callService.startCall(callerNumber);
      const currentCallId = response.call_id;
      setCallId(currentCallId);
      
      // 음성 모드 사용 여부 확인 (브라우저 지원 여부)
      const sttSupported = window.SpeechRecognition || window.webkitSpeechRecognition;
      const ttsSupported = window.speechSynthesis;
      const voiceSupported = sttSupported && ttsSupported;
      
      if (!voiceSupported) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.\n\nChrome 또는 Edge 브라우저를 사용해주세요.');
        setCallStatus('incoming');
        return;
      }
      
      // 음성 모드만 사용
      console.log('음성 모드로 통화 시작');
      
      // VoiceCallHandler 초기화
      voiceCallHandlerRef.current = new VoiceCallHandler(callService);
      
      // 통화 시작
      await voiceCallHandlerRef.current.startCall(callerNumber, {
        onConversationUpdate: (history) => {
          setConversationHistory(history);
          conversationHistoryRef.current = history;
        },
        onScamScoreUpdate: (score) => {
          setScamScore(score);
          scamScoreRef.current = score;
        },
        onError: (errorType, errorMessage) => {
          console.error('음성 통화 에러:', errorType, errorMessage);
          
          // 에러 타입에 따른 처리
          if (errorType === 'STT_ERROR' || errorType === 'PERMISSION_DENIED') {
            if (errorMessage && errorMessage.includes('마이크 권한')) {
                const userConfirmed = confirm(
                  `마이크 권한 필요\n\n${errorMessage}\n\n해결 방법:\n1. 브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭\n2. 마이크 권한을 "허용"으로 변경\n3. "확인"을 눌러 재시도\n\n지금 재시도하시겠습니까?`
                );
              
              if (userConfirmed) {
                // 재시도
                setTimeout(() => {
                  voiceCallHandlerRef.current?.stt?.startListening(
                    (text) => voiceCallHandlerRef.current.handleCallerSpeech(text),
                    (error, msg) => voiceCallHandlerRef.current.handleSTTError(error, msg)
                  ).catch(err => {
                    console.error('재시도 실패:', err);
                    alert('음성 모드 사용에 실패했습니다.');
                  });
                }, 500);
                return;
              }
            }
          }
          
          // 에러 발생 시 통화 종료
          alert(`음성 통화 오류: ${errorMessage}\n\n통화를 종료합니다.`);
          handleEndCall();
        }
      }, userRole);  // 사용자 역할 전달
      
      // 타이머 시작
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    } catch (error) {
      alert('통화 시작에 실패했습니다.');
    }
  };

  const handleEndCall = async () => {
    // 음성 모드로 통화 종료
    if (voiceCallHandlerRef.current && voiceCallHandlerRef.current.isActive()) {
      try {
        console.log('음성 모드 통화 종료');
        const response = await voiceCallHandlerRef.current.endCall();
        const report = response?.report;
        
        if (report) {
          storage.addCall({
            callerNumber,
            callId: callId || `call_${Date.now()}`,
            report,
            conversationHistory: voiceCallHandlerRef.current.getConversationHistory(),
            elapsedTime
          });
          
          onReport(report, callerNumber, callId || `call_${Date.now()}`);
        }
      } catch (error) {
        console.error('음성 통화 종료 실패:', error);
        alert('통화 종료 중 오류가 발생했습니다.');
      }
      return;
    }
    
    // 음성 모드가 아닌 경우 (에러 처리)
    // ref를 사용하여 최신 값 보장
    // 하지만 state도 확인하여 더 최신 값이 있으면 사용
    const currentHistory = conversationHistoryRef.current;
    const refScore = scamScoreRef.current;
    const stateScore = scamScore;
    
    // state와 ref 중 더 높은 값을 사용 (state가 더 최신일 수 있음)
    const currentScore = Math.max(refScore, stateScore);
    
    console.log('=== 통화 종료 ===');
    console.log('대화 내역:', currentHistory.length, '턴');
    console.log('ref 점수:', (refScore * 100).toFixed(0) + '%');
    console.log('state 점수:', (stateScore * 100).toFixed(0) + '%');
    console.log('사용할 점수:', (currentScore * 100).toFixed(0) + '%');
    console.log('대화 내용:', currentHistory);
    
    try {
            
            const response = await callService.endCall(callId || `call_${Date.now()}`, currentHistory);
            
            // 백엔드 리포트가 있어도 통화 중 계산된 점수를 우선 사용
            let report = response?.report;
            
            // 통화 중 계산된 점수가 있으면 항상 새로 생성 (점수 일치 보장)
            if (!report || !report.scam_score || currentScore > 0) {
              console.log('리포트가 없거나 불완전함. 새로 생성합니다.');
              const callerMessages = currentHistory.filter(h => h.speaker === 'caller' && h.text);
              console.log('상대방 메시지 수:', callerMessages.length);
              
              // 통화 내역 전체를 분석하여 피싱 패턴 확인
              const detectedPatterns = [];
              callerMessages.forEach(msg => {
                if (msg.text) {
                  const analysis = analyzePhishingPatterns(msg.text);
                  if (analysis.detected) {
                    detectedPatterns.push(...analysis.patterns);
                  }
                }
              });
              
              // 중복 제거하여 고유한 패턴만 추출
              const uniquePatterns = Array.from(
                new Map(detectedPatterns.map(p => [p.type, p])).values()
              );
              
              const hasAuthority = uniquePatterns.some(p => p.type === 'authorityImpersonation');
              const hasAccountRequest = uniquePatterns.some(p => p.type === 'personalInfoRequest');
              const hasUrgency = uniquePatterns.some(p => p.type === 'urgencyPressure');
              const hasThreat = uniquePatterns.some(p => p.type === 'legalThreat');
              const hasTransferRequest = uniquePatterns.some(p => p.type === 'transferRequest');
              const hasSuspiciousApproach = uniquePatterns.some(p => p.type === 'suspiciousApproach');
              
              console.log('패턴 감지:', { 
                hasAuthority, 
                hasAccountRequest, 
                hasUrgency, 
                hasThreat,
                hasTransferRequest,
                hasSuspiciousApproach,
                총_감지된_패턴: uniquePatterns.length
              });
              
              // 패턴이 감지되었는지 확인
              const hasAnyPattern = uniquePatterns.length > 0;
              
              // 통화 중에 실시간으로 계산된 점수를 그대로 사용
              // 재계산하지 않음!
              // 리포트 생성 직전에 최신 state 값 확인
              const latestStateScore = scamScore; // 클로저가 아닌 현재 state 값
              const latestRefScore = scamScoreRef.current;
              
              // state와 ref 중 더 높은 값을 사용 (최신 값 보장)
              let finalScore = Math.max(currentScore, latestStateScore, latestRefScore);
              
              console.log('=== 점수 확인 ===');
              console.log('함수 시작 시 currentScore:', (currentScore * 100).toFixed(0) + '%');
              console.log('최신 state 점수:', (latestStateScore * 100).toFixed(0) + '%');
              console.log('최신 ref 점수:', (latestRefScore * 100).toFixed(0) + '%');
              console.log('사용할 finalScore:', (finalScore * 100).toFixed(0) + '%');
              
              // 통화 중 점수가 0이고 패턴이 감지된 경우에만 최소값 보장
              if (finalScore === 0 && hasAnyPattern) {
                finalScore = 0.5;
                console.log('점수가 0이지만 패턴이 감지되어 최소 50%로 설정');
              }
              
              // 증거 수집 (점수 계산과 분리)
              const scamTypes = [];
              const evidence = [];
              
              if (hasAuthority) {
                scamTypes.push('기관 사칭');
                evidence.push('공공기관을 사칭하는 표현이 사용되었습니다.');
              }
              if (hasAccountRequest) {
                scamTypes.push('개인정보 요구');
                evidence.push('계좌번호, 비밀번호 등 민감한 개인정보를 요구하는 내용이 포함되어 있습니다.');
              }
              if (hasUrgency) {
                scamTypes.push('긴급성 압박');
                evidence.push('긴급성을 조성하는 표현이 반복적으로 사용되었습니다.');
              }
              if (hasThreat) {
                scamTypes.push('법적 위협');
                evidence.push('법적 책임, 계좌 동결 등 위협적인 표현을 사용하여 심리적 압박을 시도했습니다.');
              }
              if (hasTransferRequest) {
                scamTypes.push('송금 요구');
                evidence.push('송금 또는 이체를 요구하는 내용이 포함되어 있습니다.');
              }
              if (hasSuspiciousApproach) {
                scamTypes.push('비정상 접근');
                evidence.push('비정상적인 접근 방식이 감지되었습니다.');
              }
              
              console.log('점수 비교:', {
                통화_중_점수: (currentScore * 100).toFixed(0) + '%',
                최종_점수: (finalScore * 100).toFixed(0) + '%',
                패턴_감지: hasAnyPattern
              });
              
              // result 계산 직전에 최신 점수 재확인
              const rightBeforeResultState = scamScore;
              const rightBeforeResultRef = scamScoreRef.current;
              const rightBeforeResultScore = Math.max(finalScore, rightBeforeResultState, rightBeforeResultRef);
              
              console.log('result 계산 직전 최종 확인:');
              console.log('  finalScore:', (finalScore * 100).toFixed(0) + '%');
              console.log('  rightBeforeResultState:', (rightBeforeResultState * 100).toFixed(0) + '%');
              console.log('  rightBeforeResultRef:', (rightBeforeResultRef * 100).toFixed(0) + '%');
              console.log('  최종 사용 점수:', (rightBeforeResultScore * 100).toFixed(0) + '%');
              
              // finalScore 업데이트
              finalScore = rightBeforeResultScore;
              
              console.log('최종 스캠 점수:', (finalScore * 100).toFixed(0) + '%');
              
              // 패턴이 하나라도 감지되면 최소 "의심"으로 분류
              let result;
              if (finalScore > 0.8) {
                result = '피싱 확정';
              } else if (finalScore > 0.6 || hasAnyPattern) {
                result = '의심';
              } else {
                result = '정상';
              }
              
              // 권장 행동을 결과에 따라 다르게 설정
              let actionGuide = [];
              if (result === '피싱 확정') {
                actionGuide = [
                  '즉시 통화를 차단하세요.',
                  '다시 전화하지 마세요.',
                  '공식 기관 번호(금융감독원: 1332, 경찰청: 112)로 직접 확인하세요.',
                  '절대 계좌번호, 비밀번호, 인증번호를 알려주지 마세요.',
                  '의심스러운 통화는 녹음하고 신고하세요.'
                ];
              } else if (result === '의심') {
                actionGuide = [
                  '의심스러운 통화입니다.',
                  '다시 전화하지 마세요.',
                  '공식 기관 번호(금융감독원: 1332, 경찰청: 112)로 직접 확인하세요.',
                  '절대 계좌번호, 비밀번호, 인증번호를 알려주지 마세요.',
                  '의심스러운 통화는 녹음하고 신고하세요.'
                ];
              } else {
                actionGuide = [
                  '정상적인 통화로 보입니다.',
                  '필요시 공식 채널로 재확인하세요.'
                ];
              }
              
              // 리포트 객체 생성 직전에 최신 점수 재확인
              const rightBeforeReportState = scamScore;
              const rightBeforeReportRef = scamScoreRef.current;
              const rightBeforeReportScore = Math.max(finalScore, rightBeforeReportState, rightBeforeReportRef);
              
              console.log('리포트 생성 직전 최종 확인:');
              console.log('  finalScore:', (finalScore * 100).toFixed(0) + '%');
              console.log('  rightBeforeReportState:', (rightBeforeReportState * 100).toFixed(0) + '%');
              console.log('  rightBeforeReportRef:', (rightBeforeReportRef * 100).toFixed(0) + '%');
              console.log('  최종 사용 점수:', (rightBeforeReportScore * 100).toFixed(0) + '%');
              
              report = {
                result: result,
                risk_level: rightBeforeReportScore > 0.7 ? 'high' : rightBeforeReportScore > 0.5 ? 'medium' : 'low',
                scam_score: rightBeforeReportScore,
                scam_types: scamTypes.length > 0 ? scamTypes : (hasAnyPattern ? ['의심'] : []),
                evidence: evidence.length > 0 ? evidence : (hasAnyPattern ? ['통화 내용을 분석한 결과 의심스러운 패턴이 발견되었습니다.'] : ['통화 내용을 분석한 결과 특별한 문제가 발견되지 않았습니다.']),
                action_guide: actionGuide,
                conversation_summary: `총 ${currentHistory.length}턴의 대화가 진행되었습니다.`
              };
            } else {
              // 백엔드 리포트가 있는 경우에도 통화 중 점수로 덮어쓰기
              const latestStateScore = scamScore;
              const latestRefScore = scamScoreRef.current;
              const latestScore = Math.max(currentScore, latestStateScore, latestRefScore);
              
              console.log('백엔드 리포트를 받았지만 통화 중 점수로 덮어씁니다.');
              console.log('덮어쓸 점수:', (latestScore * 100).toFixed(0) + '%');
              report.scam_score = latestScore;
            }
            
      // 리포트 생성 직후 최종 확인 및 보정
      const finalStateScore = scamScore;
      const finalRefScore = scamScoreRef.current;
      const finalLatestScore = Math.max(currentScore, finalStateScore, finalRefScore);
      
      // 리포트 점수가 최신 점수와 다르면 덮어쓰기
      if (Math.abs(report.scam_score - finalLatestScore) > 0.001) {
        console.warn('리포트 점수가 최신 점수와 다릅니다. 덮어씁니다.');
        console.warn('리포트 점수:', (report.scam_score * 100).toFixed(0) + '%');
        console.warn('최신 점수:', (finalLatestScore * 100).toFixed(0) + '%');
        report.scam_score = finalLatestScore;
      }
      
      console.log('=== 리포트 생성 완료 ===');
      console.log('함수 시작 시 currentScore:', (currentScore * 100).toFixed(0) + '%');
      console.log('최종 state 점수:', (finalStateScore * 100).toFixed(0) + '%');
      console.log('최종 ref 점수:', (finalRefScore * 100).toFixed(0) + '%');
      console.log('최종 사용 점수:', (finalLatestScore * 100).toFixed(0) + '%');
      console.log('리포트 점수:', (report.scam_score * 100).toFixed(0) + '%');
      console.log('점수 일치 여부:', (Math.abs(report.scam_score - finalLatestScore) < 0.001 ? '일치 ✓' : '불일치 ✗'));
      console.log('생성된 리포트:', report);
      
      storage.addCall({
        callerNumber,
        callId: callId || `call_${Date.now()}`,
        report,
        conversationHistory: currentHistory,
        elapsedTime
      });
      
      onReport(report, callerNumber, callId || `call_${Date.now()}`);
    } catch (error) {
      console.error('리포트 생성 에러:', error);
      // 에러가 발생해도 기본 리포트로 진행
      const defaultReport = {
        result: '의심',
        risk_level: 'medium',
        scam_score: currentScore > 0 ? currentScore : 0.5,
        scam_types: ['분석 불가'],
        evidence: ['통화 분석 중 오류가 발생했습니다.'],
        action_guide: ['주의하세요.', '의심스러우면 다시 전화하지 마세요.'],
        conversation_summary: `총 ${currentHistory.length}턴의 대화가 진행되었습니다.`
      };
      
      storage.addCall({
        callerNumber,
        callId: callId || `call_${Date.now()}`,
        report: defaultReport,
        conversationHistory: currentHistory,
        elapsedTime
      });
      
      onReport(defaultReport, callerNumber, callId || `call_${Date.now()}`);
    }
  };


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.callHeader}>
        <h2 style={styles.callerNumber}>{callerNumber}</h2>
        {callStatus === 'ai_talking' && (
          <div>
            <p style={styles.statusText}>AI가 통화 중...</p>
            <p style={styles.timerText}>{formatTime(elapsedTime)}</p>
          </div>
        )}
      </div>

      {callStatus === 'incoming' && (
        <div style={styles.incomingContainer}>
          <h2 style={styles.incomingText}>전화가 왔습니다</h2>
          <p style={styles.questionText}>AI가 대신 받을까요?</p>
          
          {/* 역할 선택 */}
          <div style={{ marginBottom: '15px', padding: '18px', backgroundColor: '#F3F4F6', borderRadius: '12px' }}>
            <span style={{ fontSize: '16px', color: '#333', fontWeight: '600', display: 'block', marginBottom: '12px' }}>내 역할:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="userRole"
                  value="scammer"
                  checked={userRole === 'scammer'}
                  onChange={(e) => setUserRole(e.target.value)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '15px', fontWeight: '500' }}>피싱범 역할</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="userRole"
                  value="victim"
                  checked={userRole === 'victim'}
                  onChange={(e) => setUserRole(e.target.value)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '15px', fontWeight: '500' }}>피해자 역할</span>
              </label>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', marginTop: '12px', lineHeight: '1.5' }}>
              {(window.SpeechRecognition || window.webkitSpeechRecognition) && window.speechSynthesis ? (
                `음성 모드로 통화합니다 (마이크 권한 필요) - ${userRole === 'scammer' ? 'AI가 피해자 역할' : 'AI가 피싱범 역할'}`
              ) : (
                <span style={{ color: '#ff6600' }}>
                  이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요.
                </span>
              )}
            </p>
          </div>
          
          <div style={styles.buttonContainer}>
            <button style={mergeStyles(styles.button, styles.acceptButton)} onClick={handleAIAccept}>
              AI 대신 받기
            </button>
            <button style={mergeStyles(styles.button, styles.rejectButton)} onClick={() => onEndCall()}>
              거절
            </button>
          </div>
        </div>
      )}

      {callStatus === 'ai_talking' && (
        <div style={styles.talkingContainer}>
          <div style={styles.conversationBox}>
            <h3 style={styles.conversationTitle}>대화 진행 중...</h3>
            <div style={styles.scamScoreBox}>
              <span>스캠 점수: </span>
              <span style={mergeStyles(styles.scamScoreValue, scamScore > 0.7 && styles.scamScoreHigh)}>
                {(scamScore * 100).toFixed(0)}%
              </span>
            </div>
            <div style={styles.conversationHistory}>
              {conversationHistory.map((item, index) => (
                <div
                  key={index}
                  style={mergeStyles(
                    styles.messageBubble,
                    item.speaker === 'ai' ? styles.aiMessage : styles.callerMessage
                  )}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          <button style={styles.endButton} onClick={handleEndCall}>
            통화 종료
          </button>
        </div>
      )}
    </div>
  );
}

// 리포트 화면
function CallReportScreen({ report, callerNumber, callId, onBack }) {
  const getResultColor = (result) => {
    if (result === '피싱 확정') return '#f5576c';
    if (result === '의심') return '#f39c12';
    return '#667eea';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>통화 결과 요약</h2>
        <p style={styles.callerNumber}>{callerNumber}</p>
      </div>
      <div style={styles.content}>
        <div style={styles.resultBox}>
          <div style={styles.resultHeader}>
            <h2 style={mergeStyles(styles.resultText, { color: getResultColor(report.result) })}>
              {report.result}
            </h2>
          </div>
          <div style={styles.scoreBox}>
            <span>스캠 점수: </span>
            <span style={mergeStyles(styles.scoreValue, report.scam_score > 0.7 && styles.scoreHigh)}>
              {(report.scam_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>판단 근거</h3>
          {report.evidence && report.evidence.map((item, index) => (
            <div key={index} style={styles.evidenceItem}>
              <span style={styles.evidenceBullet}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {report.scam_types && report.scam_types.length > 0 && (
          <div style={styles.sectionBox}>
            <h3 style={styles.sectionTitle}>추정 스캠 유형</h3>
            <div style={styles.scamTypesContainer}>
              {report.scam_types.map((type, index) => (
                <span key={index} style={styles.scamTypeTag}>{type}</span>
              ))}
            </div>
          </div>
        )}

        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>💡 권장 행동</h3>
          {report.action_guide && report.action_guide.map((item, index) => (
            <div key={index} style={styles.actionItem}>
              <span style={styles.actionBullet}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button style={styles.primaryButton} onClick={onBack}>
            홈으로 돌아가기
          </button>
          {report.result === '피싱 확정' && (
            <button style={styles.reportButton} onClick={() => alert('112(경찰청) 또는 1332(금융감독원)로 신고하세요.')}>
              신고하기
            </button>
          )}
          <button 
            style={mergeStyles(styles.commentBtn, { width: '100%', padding: '12px', backgroundColor: 'rgba(255, 158, 197, 0.1)', color: '#FF9EC5', borderColor: 'rgba(255, 158, 197, 0.3)' })}
            onClick={() => {
              if (confirm(`${callerNumber}을(를) 차단 목록에 추가하시겠습니까?`)) {
                storage.addBlock(callerNumber, report?.result === '피싱 확정' ? '피싱 확정' : '의심스러운 통화');
                alert('차단 목록에 추가되었습니다.');
              }
            }}
          >
            이 번호 차단하기
          </button>
        </div>
      </div>
    </div>
  );
}

// 히스토리 화면
function HistoryScreen({ onViewDetail }) {
  const [history, setHistory] = useState(storage.getHistory());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState('');

  const filteredHistory = history.filter(item => {
    const matchesSearch = !searchTerm || item.callerNumber.includes(searchTerm);
    const matchesFilter = filterType === 'all' || 
      (filterType === 'phishing' && item.report?.result === '피싱 확정') ||
      (filterType === 'suspicious' && item.report?.result === '의심') ||
      (filterType === 'normal' && item.report?.result === '정상');
    return matchesSearch && matchesFilter;
  });

  const handleSaveComment = (callId) => {
    storage.updateComment(callId, commentText);
    setHistory(storage.getHistory());
    setEditingComment(null);
    setCommentText('');
  };

  const handleEditComment = (item) => {
    setEditingComment(item.id);
    setCommentText(item.userComment || '');
  };

  const getResultBadge = (result) => {
    const badges = {
      '피싱 확정': { icon: '', color: '#E74C3C', bg: '#FFEBEE' },
      '의심': { icon: '', color: '#F39C12', bg: '#FFF3E0' },
      '정상': { icon: '', color: '#50C878', bg: '#E8F5E9' }
    };
    return badges[result] || badges['의심'];
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>통화 히스토리</h2>
      </div>
      <div style={styles.content}>
        <div style={styles.filterBox}>
          <input
            type="text"
            placeholder="전화번호 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">전체</option>
            <option value="phishing">피싱 확정</option>
            <option value="suspicious">의심</option>
            <option value="normal">정상</option>
          </select>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>통화 기록이 없습니다.</p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {filteredHistory.map((item) => {
              const badge = getResultBadge(item.report?.result);
              return (
                <div
                  key={item.id}
                  style={styles.historyItem}
                  onClick={() => onViewDetail(item)}
                >
                  <div style={styles.historyHeader}>
                    <div style={styles.historyLeft}>
                      <span style={styles.historyNumber}>{item.callerNumber}</span>
                      <span style={mergeStyles(styles.historyBadge, { backgroundColor: badge.bg, color: badge.color })}>
                        {item.report?.result || '분석 중'}
                      </span>
                    </div>
                    <span style={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div style={styles.historyBody}>
                    <div style={styles.historySummary}>
                      <span style={styles.historyScore}>
                        스캠 점수: {(item.report?.scam_score * 100 || 0).toFixed(0)}%
                      </span>
                      {item.report?.scam_types && item.report.scam_types.length > 0 && (
                        <span style={styles.historyTypes}>
                          {item.report.scam_types.join(', ')}
                        </span>
                      )}
                    </div>
                    {item.userComment && (
                      <div style={styles.historyComment}>
                        {item.userComment}
                      </div>
                    )}
                    {editingComment === item.id ? (
                      <div style={styles.commentEditBox}>
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="코멘트 입력..."
                          style={styles.commentInput}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveComment(item.id);
                          }}
                        />
                        <div style={styles.commentButtons}>
                          <button
                            style={styles.commentSaveBtn}
                            onClick={() => handleSaveComment(item.id)}
                          >
                            저장
                          </button>
                          <button
                            style={styles.commentCancelBtn}
                            onClick={() => {
                              setEditingComment(null);
                              setCommentText('');
                            }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          style={styles.commentBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditComment(item);
                          }}
                        >
                          {item.userComment ? '코멘트 수정' : '코멘트 추가'}
                        </button>
                        <button
                          style={mergeStyles(styles.commentBtn, { backgroundColor: 'rgba(255, 158, 197, 0.1)', color: '#FF9EC5', borderColor: 'rgba(255, 158, 197, 0.3)' })}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`${item.callerNumber}을(를) 차단 목록에 추가하시겠습니까?`)) {
                              storage.addBlock(item.callerNumber, item.report?.result || '의심스러운 통화');
                              alert('차단 목록에 추가되었습니다.');
                            }
                          }}
                        >
                          차단하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 번호 상세 화면
function NumberDetailScreen({ callData, onBack }) {
  const { callerNumber, report, conversationHistory, elapsedTime, createdAt, userComment } = callData;
  const [commentText, setCommentText] = useState(userComment || '');
  const [isEditingComment, setIsEditingComment] = useState(!userComment);

  const handleSaveComment = () => {
    storage.updateComment(callData.id, commentText);
    setIsEditingComment(false);
    alert('코멘트가 저장되었습니다.');
  };

  const getResultColor = (result) => {
    if (result === '피싱 확정') return '#f5576c';
    if (result === '의심') return '#f39c12';
    return '#667eea';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>← 뒤로</button>
        <h2 style={styles.headerTitle}>통화 상세 정보</h2>
        <p style={styles.callerNumber}>{callerNumber}</p>
      </div>
      <div style={styles.content}>
        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>기본 정보</h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>통화 시간:</span>
              <span>{new Date(createdAt).toLocaleString('ko-KR')}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>통화 길이:</span>
              <span>{Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>판별 결과:</span>
              <span style={{ color: getResultColor(report?.result), fontWeight: '600' }}>
                {report?.result}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>스캠 점수:</span>
              <span style={mergeStyles(styles.scoreValue, report?.scam_score > 0.7 && styles.scoreHigh)}>
                {(report?.scam_score * 100 || 0).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>내 코멘트</h3>
          {isEditingComment ? (
            <div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="이 번호에 대한 코멘트를 입력하세요..."
                style={styles.commentTextarea}
                rows="3"
              />
              <div style={styles.commentButtons}>
                <button style={styles.commentSaveBtn} onClick={handleSaveComment}>
                  저장
                </button>
                <button
                  style={styles.commentCancelBtn}
                  onClick={() => {
                    setCommentText(userComment || '');
                    setIsEditingComment(false);
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={styles.commentDisplay}>{commentText || '코멘트가 없습니다.'}</p>
              <button style={styles.commentBtn} onClick={() => setIsEditingComment(true)}>
                {commentText ? '수정' : '추가'}
              </button>
            </div>
          )}
        </div>

        {report && (
          <>
            <div style={styles.sectionBox}>
              <h3 style={styles.sectionTitle}>분석 결과 요약</h3>
              {report.evidence && report.evidence.length > 0 && (
                <div style={styles.summaryBox}>
                  <h4 style={styles.summaryTitle}>판단 근거</h4>
                  {report.evidence.map((item, index) => (
                    <div key={index} style={styles.evidenceItem}>
                      <span style={styles.evidenceBullet}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {report.scam_types && report.scam_types.length > 0 && (
                <div style={styles.summaryBox}>
                  <h4 style={styles.summaryTitle}>스캠 유형</h4>
                  <div style={styles.scamTypesContainer}>
                    {report.scam_types.map((type, index) => (
                      <span key={index} style={styles.scamTypeTag}>{type}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.sectionBox}>
              <h3 style={styles.sectionTitle}>권장 행동</h3>
              {report.action_guide && report.action_guide.map((item, index) => (
                <div key={index} style={styles.actionItem}>
                  <span style={styles.actionBullet}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {conversationHistory && conversationHistory.length > 0 && (
          <div style={styles.sectionBox}>
            <h3 style={styles.sectionTitle}>대화 내역</h3>
            <div style={styles.conversationDetail}>
              {conversationHistory.map((item, index) => (
                <div
                  key={index}
                  style={mergeStyles(
                    styles.messageBubble,
                    item.speaker === 'ai' ? styles.aiMessage : styles.callerMessage
                  )}
                >
                  <div style={styles.messageHeader}>
                    <span style={styles.messageSpeaker}>
                      {item.speaker === 'ai' ? 'AI' : '상대방'}
                    </span>
                    <span style={styles.messageTime}>
                      {new Date(item.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                  </div>
                  <div style={styles.messageText}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button style={styles.primaryButton} onClick={onBack}>
            목록으로 돌아가기
          </button>
          <button 
            style={mergeStyles(styles.commentBtn, { width: '100%', padding: '12px', backgroundColor: 'rgba(255, 158, 197, 0.1)', color: '#FF9EC5', borderColor: 'rgba(255, 158, 197, 0.3)' })}
            onClick={() => {
              if (confirm(`${callerNumber}을(를) 차단 목록에 추가하시겠습니까?`)) {
                storage.addBlock(callerNumber, report?.result || '의심스러운 통화');
                alert('차단 목록에 추가되었습니다.');
              }
            }}
          >
            이 번호 차단하기
          </button>
        </div>
      </div>
    </div>
  );
}

// 차단 목록 화면
function BlockListScreen({ onBack }) {
  const [blockList, setBlockList] = useState(storage.getBlockList());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newReason, setNewReason] = useState('');

  const handleAddBlock = () => {
    if (!newNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }
    storage.addBlock(newNumber.trim(), newReason.trim());
    setBlockList(storage.getBlockList());
    setNewNumber('');
    setNewReason('');
    setShowAddForm(false);
    alert('차단 목록에 추가되었습니다.');
  };

  const handleRemoveBlock = (blockId) => {
    if (confirm('차단을 해제하시겠습니까?')) {
      storage.removeBlock(blockId);
      setBlockList(storage.getBlockList());
      alert('차단이 해제되었습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>← 뒤로</button>
        <h2 style={styles.headerTitle}>차단 목록</h2>
      </div>
      <div style={styles.content}>
        <div style={styles.sectionBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={styles.sectionTitle}>차단된 번호 ({blockList.length}개)</h3>
            <button 
              style={mergeStyles(styles.commentSaveBtn, { marginBottom: 0 })}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '취소' : '번호 추가'}
            </button>
          </div>

          {showAddForm && (
            <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="전화번호 (예: 010-1234-5678)"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                style={mergeStyles(styles.searchInput, { marginBottom: '12px' })}
              />
              <input
                type="text"
                placeholder="차단 사유 (선택사항)"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                style={mergeStyles(styles.searchInput, { marginBottom: '12px' })}
              />
              <button style={styles.commentSaveBtn} onClick={handleAddBlock}>
                차단 추가
              </button>
            </div>
          )}

          {blockList.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>차단된 번호가 없습니다.</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {blockList.map((item) => (
                <div key={item.id} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <div style={styles.historyLeft}>
                      <span style={styles.historyNumber}>{item.number}</span>
                      <span style={mergeStyles(styles.historyBadge, { backgroundColor: 'rgba(255, 158, 197, 0.15)', color: '#FF9EC5' })}>
                        차단됨
                      </span>
                    </div>
                    <span style={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {item.reason && (
                    <div style={styles.historyBody}>
                      <div style={styles.historyComment}>
                        사유: {item.reason}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      style={styles.commentCancelBtn}
                      onClick={() => handleRemoveBlock(item.id)}
                    >
                      차단 해제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 설정 화면
function SettingsScreen() {
  const [history, setHistory] = useState(storage.getHistory());

  const handleClearHistory = () => {
    if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
      storage.saveHistory([]);
      setHistory([]);
      alert('히스토리가 삭제되었습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>설정</h2>
      </div>
      <div style={styles.content}>
        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>데이터 관리</h3>
          <div style={styles.settingsItem}>
            <span>저장된 통화 기록: {history.length}개</span>
            <button style={styles.dangerButton} onClick={handleClearHistory}>
              전체 삭제
            </button>
          </div>
        </div>
        <div style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>정보</h3>
          <div style={styles.infoText}>
            <p>5분 방패 AI v1.0.0</p>
            <p>사기범과 나 사이에 서는 AI 통화 보호막</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 앱
function App() {
  const [screen, setScreen] = useState('home');
  const [callerNumber, setCallerNumber] = useState('');
  const [report, setReport] = useState(null);
  const [callId, setCallId] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);

  const handleIncomingCall = (number) => {
    setCallerNumber(number);
    setScreen('incoming');
  };

  const handleReport = (reportData, number, id) => {
    setReport(reportData);
    setCallerNumber(number);
    setCallId(id);
    setScreen('report');
  };

  const handleBack = () => {
    setScreen('home');
    setReport(null);
    setSelectedCall(null);
  };

  const handleViewDetail = (callData) => {
    setSelectedCall(callData);
    setScreen('detail');
  };

  return (
    <div>
      {screen !== 'incoming' && screen !== 'report' && screen !== 'detail' && screen !== 'blocklist' && (
        <NavBar currentScreen={screen} onNavigate={setScreen} />
      )}
      {screen === 'home' && <HomeScreen onIncomingCall={handleIncomingCall} onNavigate={setScreen} />}
      {screen === 'incoming' && (
        <IncomingCallScreen
          callerNumber={callerNumber}
          onEndCall={handleBack}
          onReport={handleReport}
        />
      )}
      {screen === 'report' && (
        <CallReportScreen
          report={report}
          callerNumber={callerNumber}
          callId={callId}
          onBack={handleBack}
        />
      )}
      {screen === 'history' && <HistoryScreen onViewDetail={handleViewDetail} />}
      {screen === 'detail' && (
        <NumberDetailScreen callData={selectedCall} onBack={() => setScreen('history')} />
      )}
      {screen === 'blocklist' && <BlockListScreen onBack={() => setScreen('home')} />}
      {screen === 'settings' && <SettingsScreen />}
    </div>
  );
}

// 스타일
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F8F9FA', paddingBottom: '20px' },
  navBar: { background: '#FFFFFF', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 },
  navContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#B794F6', fontSize: '20px', fontWeight: '700' },
  navIcon: { fontSize: '24px' },
  navTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a' },
  navMenu: { display: 'flex', gap: '8px' },
  navButton: { backgroundColor: 'transparent', border: 'none', color: '#6B7280', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '400', transition: 'all 0.2s ease' },
  navButtonActive: { backgroundColor: '#F3F4F6', color: '#B794F6', fontWeight: '700' },
  header: { background: 'linear-gradient(135deg, #B794F6 0%, #FFB3D9 100%)', padding: '32px 24px', textAlign: 'center', color: '#FFFFFF' },
  title: { fontSize: '28px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '400' },
  content: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  mainActionCard: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(183, 148, 246, 0.1)' },
  mainActionContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mainActionText: { flex: 1 },
  mainActionTitle: { fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' },
  mainActionSubtitle: { fontSize: '14px', color: '#6B7280', fontWeight: '400', lineHeight: '1.5' },
  mainActionIcon: { fontSize: '48px', marginLeft: '16px' },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' },
  serviceCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', textAlign: 'center', transition: 'all 0.2s ease' },
  serviceIcon: { fontSize: '32px', marginBottom: '12px' },
  serviceTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' },
  serviceDesc: { fontSize: '13px', color: '#6B7280', fontWeight: '400', lineHeight: '1.5' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  infoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  infoCardTitle: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a' },
  infoButton: { width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#F3F4F6', border: 'none', color: '#6B7280', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  infoCardText: { fontSize: '14px', color: '#6B7280', lineHeight: '1.6', fontWeight: '400' },
  infoBox: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  infoTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#1a1a1a', letterSpacing: '-0.3px' },
  infoText: { fontSize: '14px', color: '#6B7280', lineHeight: '1.6', fontWeight: '400' },
  testButton: { width: '100%', background: 'linear-gradient(135deg, #B794F6 0%, #FFB3D9 100%)', color: '#FFFFFF', padding: '18px', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', boxShadow: '0 4px 12px rgba(183, 148, 246, 0.25)', transition: 'all 0.2s ease' },
  featuresBox: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  featuresTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a', letterSpacing: '-0.3px' },
  featureItem: { display: 'flex', alignItems: 'center', marginBottom: '12px', fontSize: '14px', color: '#6B7280', fontWeight: '400' },
  featureIcon: { fontSize: '20px', marginRight: '12px' },
  callHeader: { background: 'linear-gradient(135deg, rgba(232, 213, 255, 0.6) 0%, rgba(255, 229, 241, 0.6) 100%)', backdropFilter: 'blur(20px)', padding: '40px 30px', textAlign: 'center', color: '#6B46C1', borderBottom: '1px solid rgba(255,255,255,0.3)' },
  callerNumber: { fontSize: '28px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px', color: '#9F7AEA' },
  statusText: { fontSize: '15px', marginTop: '8px', fontWeight: '400', color: '#9F7AEA', opacity: 0.8 },
  timerText: { fontSize: '20px', fontWeight: '700', marginTop: '8px', letterSpacing: '-0.3px', color: '#B794F6' },
  incomingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' },
  incomingText: { fontSize: '32px', fontWeight: '700', marginBottom: '24px', color: '#9F7AEA', letterSpacing: '-0.8px' },
  questionText: { fontSize: '18px', color: '#6B7280', marginBottom: '48px', fontWeight: '400' },
  buttonContainer: { width: '100%', maxWidth: '400px' },
  button: { width: '100%', padding: '20px', borderRadius: '20px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px', transition: 'all 0.3s ease', letterSpacing: '-0.2px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  acceptButton: { background: 'linear-gradient(135deg, #B794F6 0%, #FFB3D9 100%)', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(183, 148, 246, 0.3)' },
  rejectButton: { background: 'linear-gradient(135deg, #FFB3D9 0%, #FF9EC5 100%)', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(255, 179, 217, 0.3)' },
  talkingContainer: { padding: '24px' },
  conversationBox: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', marginBottom: '20px', minHeight: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.2)' },
  conversationTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a1a1a', letterSpacing: '-0.3px' },
  scamScoreBox: { padding: '16px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(102, 126, 234, 0.2)' },
  scamScoreValue: { fontSize: '20px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' },
  scamScoreHigh: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  conversationHistory: { maxHeight: '300px', overflowY: 'auto', padding: '8px' },
  messageBubble: { padding: '16px', borderRadius: '16px', marginBottom: '12px', maxWidth: '80%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  aiMessage: { background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', alignSelf: 'flex-start', border: '1px solid rgba(102, 126, 234, 0.2)' },
  callerMessage: { background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%)', alignSelf: 'flex-end', marginLeft: 'auto', border: '1px solid rgba(245, 87, 108, 0.2)' },
  endButton: { width: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#FFFFFF', padding: '20px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)', transition: 'all 0.3s ease', letterSpacing: '-0.2px' },
  headerTitle: { fontSize: '28px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px' },
  resultBox: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.2)' },
  resultHeader: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  resultIcon: { fontSize: '32px', marginRight: '12px' },
  resultText: { fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' },
  scoreBox: { paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.08)' },
  scoreValue: { fontSize: '24px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' },
  scoreHigh: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sectionBox: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '28px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1a1a1a', letterSpacing: '-0.3px' },
  evidenceItem: { display: 'flex', marginBottom: '12px', fontSize: '15px', color: '#4a5568', lineHeight: '1.6' },
  evidenceBullet: { fontSize: '18px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginRight: '12px', fontWeight: '700' },
  scamTypesContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  scamTypeTag: { background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', color: '#667eea', fontWeight: '600', border: '1px solid rgba(102, 126, 234, 0.2)' },
  actionItem: { display: 'flex', marginBottom: '12px', fontSize: '15px', color: '#4a5568', lineHeight: '1.6' },
  actionBullet: { fontSize: '18px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginRight: '12px', fontWeight: '700' },
  primaryButton: { width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF', padding: '20px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)', transition: 'all 0.3s ease', letterSpacing: '-0.2px' },
  reportButton: { width: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#FFFFFF', padding: '20px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)', transition: 'all 0.3s ease', letterSpacing: '-0.2px' },
  filterBox: { display: 'flex', gap: '12px', marginBottom: '24px' },
  searchInput: { flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', transition: 'all 0.3s ease', fontWeight: '400' },
  filterSelect: { padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', cursor: 'pointer', fontWeight: '400' },
  emptyState: { textAlign: 'center', padding: '80px 20px', color: '#9ca3af' },
  emptyText: { fontSize: '17px', fontWeight: '400' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  historyItem: { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.2)' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  historyLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  historyNumber: { fontSize: '20px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px' },
  historyBadge: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', letterSpacing: '-0.1px' },
  historyDate: { fontSize: '13px', color: '#9ca3af', fontWeight: '400' },
  historyBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
  historySummary: { display: 'flex', gap: '16px', alignItems: 'center' },
  historyScore: { fontSize: '15px', color: '#4a5568', fontWeight: '500' },
  historyTypes: { fontSize: '13px', color: '#9ca3af', fontWeight: '400' },
  historyComment: { fontSize: '15px', color: '#4a5568', fontStyle: 'italic', padding: '12px', backgroundColor: 'rgba(102, 126, 234, 0.05)', borderRadius: '10px', border: '1px solid rgba(102, 126, 234, 0.1)' },
  commentEditBox: { display: 'flex', flexDirection: 'column', gap: '10px' },
  commentInput: { padding: '12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.95)', fontWeight: '400' },
  commentTextarea: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: 'rgba(255,255,255,0.95)', fontWeight: '400' },
  commentButtons: { display: 'flex', gap: '10px' },
  commentBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.3s ease' },
  commentSaveBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' },
  commentCancelBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  commentDisplay: { fontSize: '15px', color: '#4a5568', padding: '16px', backgroundColor: 'rgba(102, 126, 234, 0.05)', borderRadius: '12px', marginBottom: '12px', minHeight: '50px', border: '1px solid rgba(102, 126, 234, 0.1)', lineHeight: '1.6' },
  backButton: { position: 'absolute', left: '24px', top: '24px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  infoLabel: { fontSize: '13px', color: '#9ca3af', fontWeight: '600', letterSpacing: '-0.1px' },
  summaryBox: { marginBottom: '20px', padding: '20px', backgroundColor: 'rgba(102, 126, 234, 0.05)', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.1)' },
  summaryTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1a1a1a', letterSpacing: '-0.2px' },
  conversationDetail: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '8px' },
  messageHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  messageSpeaker: { fontSize: '13px', fontWeight: '600', color: '#4a5568', letterSpacing: '-0.1px' },
  messageTime: { fontSize: '12px', color: '#9ca3af', fontWeight: '400' },
  messageText: { fontSize: '15px', color: '#1a1a1a', lineHeight: '1.6', fontWeight: '400' },
  dangerButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)', transition: 'all 0.3s ease' },
  settingsItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }
};

ReactDOM.render(<App />, document.getElementById('root'));

