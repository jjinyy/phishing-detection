import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { callService } from '../services/api';

export default function IncomingCallScreen({ route, navigation }) {
  const { callerNumber } = route.params || { callerNumber: '010-0000-0000' };
  const [callStatus, setCallStatus] = useState('incoming'); // incoming, ai_talking, ended
  const [callId, setCallId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scamScore, setScamScore] = useState(0);
  const timerRef = useRef(null);
  const maxDuration = 300; // 5분 (초)

  useEffect(() => {
    if (callStatus === 'ai_talking') {
      // 타이머 시작
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= maxDuration) {
            handleEndCall();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);

      // 시뮬레이션: AI 통화 진행
      simulateAICall();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  const handleAIAccept = async () => {
    try {
      setCallStatus('ai_talking');
      
      // AI 대리 통화 시작
      const response = await callService.startCall(callerNumber);
      setCallId(response.call_id);
      
      // 초기 대화 추가
      setConversationHistory([
        {
          speaker: 'caller',
          text: '안녕하세요, 검찰청입니다.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '통화 시작에 실패했습니다.');
      console.error(error);
    }
  };

  const simulateAICall = async () => {
    // 시뮬레이션: 통화 진행
    const simulatedConversation = [
      {
        speaker: 'caller',
        text: '안녕하세요, 검찰청입니다. 계좌 안전조치가 필요합니다.',
        timestamp: new Date().toISOString(),
      },
      {
        speaker: 'ai',
        text: '네, 확인해보고 다시 연락드리겠습니다.',
        timestamp: new Date().toISOString(),
      },
      {
        speaker: 'caller',
        text: '지금 당장 처리해야 합니다. 계좌번호를 알려주세요.',
        timestamp: new Date().toISOString(),
      },
      {
        speaker: 'ai',
        text: '죄송하지만 개인정보는 제공할 수 없습니다.',
        timestamp: new Date().toISOString(),
      },
    ];

    // 대화를 순차적으로 추가
    for (let i = 0; i < simulatedConversation.length; i++) {
      setTimeout(() => {
        setConversationHistory((prev) => [...prev, simulatedConversation[i]]);
        
        // 스캠 점수 업데이트 (시뮬레이션)
        if (simulatedConversation[i].speaker === 'caller') {
          const newScore = Math.min(0.3 + i * 0.15, 0.85);
          setScamScore(newScore);
        }
      }, (i + 1) * 2000);
    }

    // 10초 후 자동 종료 (시뮬레이션)
    setTimeout(() => {
      handleEndCall();
    }, 10000);
  };

  const handleEndCall = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      setCallStatus('ended');
      
      // 리포트 생성
      const response = await callService.endCall(callId, conversationHistory);
      
      // 리포트 화면으로 이동
      navigation.navigate('CallReport', {
        report: response.report,
        callerNumber,
        callId,
      });
    } catch (error) {
      Alert.alert('오류', '리포트 생성에 실패했습니다.');
      console.error(error);
    }
  };

  const handleReject = () => {
    Alert.alert('통화 거절', '통화를 거절했습니다.');
    navigation.goBack();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.callHeader}>
        <Text style={styles.callerNumber}>{callerNumber}</Text>
        {callStatus === 'ai_talking' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.statusText}>AI가 통화 중...</Text>
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        )}
      </View>

      {callStatus === 'incoming' && (
        <View style={styles.incomingContainer}>
          <Text style={styles.incomingText}>📞 전화가 왔습니다</Text>
          <Text style={styles.questionText}>AI가 대신 받을까요?</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAIAccept}
            >
              <Text style={styles.buttonText}>✅ AI 대신 받기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
            >
              <Text style={styles.buttonText}>❌ 거절</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {callStatus === 'ai_talking' && (
        <View style={styles.talkingContainer}>
          <View style={styles.conversationBox}>
            <Text style={styles.conversationTitle}>대화 진행 중...</Text>
            <View style={styles.scamScoreBox}>
              <Text style={styles.scamScoreLabel}>스캠 점수:</Text>
              <Text style={[styles.scamScoreValue, scamScore > 0.7 && styles.scamScoreHigh]}>
                {(scamScore * 100).toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.conversationHistory}>
              {conversationHistory.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    item.speaker === 'ai' ? styles.aiMessage : styles.callerMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndCall}
          >
            <Text style={styles.endButtonText}>통화 종료</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  callHeader: {
    backgroundColor: '#4A90E2',
    padding: 30,
    alignItems: 'center',
  },
  callerNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 5,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  incomingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incomingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  acceptButton: {
    backgroundColor: '#50C878',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  talkingContainer: {
    flex: 1,
    padding: 20,
  },
  conversationBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  scamScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  scamScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  scamScoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  scamScoreHigh: {
    color: '#E74C3C',
  },
  conversationHistory: {
    flex: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  callerMessage: {
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  endButton: {
    backgroundColor: '#E74C3C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

