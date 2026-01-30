import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  const [recentCalls, setRecentCalls] = useState([]);

  const handleIncomingCall = () => {
    // 시뮬레이션: 낯선 번호로부터 전화 수신
    const callerNumber = '010-1234-5678';
    navigation.navigate('IncomingCall', { callerNumber });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>5분 방패 AI</Text>
        <Text style={styles.subtitle}>사기범과 나 사이에 서는 AI 통화 보호막</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📞 서비스 안내</Text>
          <Text style={styles.infoText}>
            낯선 전화가 오면 AI가 최대 5분간 대신 통화하여{'\n'}
            피싱 여부를 분석하고, 통화 결과 보고서를 제공합니다.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleIncomingCall}
        >
          <Text style={styles.testButtonText}>📱 테스트: 전화 수신 시뮬레이션</Text>
        </TouchableOpacity>

        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>주요 기능</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>AI 대리 통화 (최대 5분)</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureText}>실시간 스캠 패턴 분석</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>통화 결과 리포트 제공</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>👤</Text>
            <Text style={styles.featureText}>사용자 직접 판단 구조</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F4F8',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#50C878',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
});

