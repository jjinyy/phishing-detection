import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function CallReportScreen({ route, navigation }) {
  const { report, callerNumber, callId } = route.params || {};
  
  if (!report) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>리포트 데이터가 없습니다.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getResultIcon = (result) => {
    if (result === '피싱 확정') return '🚨';
    if (result === '의심') return '⚠️';
    return '✅';
  };

  const getResultColor = (result) => {
    if (result === '피싱 확정') return '#E74C3C';
    if (result === '의심') return '#F39C12';
    return '#50C878';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📞 통화 결과 요약</Text>
        <Text style={styles.callerNumber}>{callerNumber}</Text>
      </View>

      <View style={styles.content}>
        {/* 판별 결과 */}
        <View style={styles.resultBox}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{getResultIcon(report.result)}</Text>
            <Text
              style={[
                styles.resultText,
                { color: getResultColor(report.result) },
              ]}
            >
              {report.result}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>스캠 점수:</Text>
            <Text
              style={[
                styles.scoreValue,
                report.scam_score > 0.7 && styles.scoreHigh,
              ]}
            >
              {(report.scam_score * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* 판단 근거 */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>📋 판단 근거</Text>
          {report.evidence && report.evidence.length > 0 ? (
            report.evidence.map((item, index) => (
              <View key={index} style={styles.evidenceItem}>
                <Text style={styles.evidenceBullet}>•</Text>
                <Text style={styles.evidenceText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>근거 정보가 없습니다.</Text>
          )}
        </View>

        {/* 스캠 유형 */}
        {report.scam_types && report.scam_types.length > 0 && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>🔍 추정 스캠 유형</Text>
            <View style={styles.scamTypesContainer}>
              {report.scam_types.map((type, index) => (
                <View key={index} style={styles.scamTypeTag}>
                  <Text style={styles.scamTypeText}>{type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 권장 행동 가이드 */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>💡 권장 행동</Text>
          {report.action_guide && report.action_guide.length > 0 ? (
            report.action_guide.map((item, index) => (
              <View key={index} style={styles.actionItem}>
                <Text style={styles.actionBullet}>✓</Text>
                <Text style={styles.actionText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>권장 사항이 없습니다.</Text>
          )}
        </View>

        {/* 대화 요약 */}
        {report.conversation_summary && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>📝 대화 요약</Text>
            <Text style={styles.summaryText}>{report.conversation_summary}</Text>
          </View>
        )}

        {/* 하단 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.primaryButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
          
          {report.result === '피싱 확정' && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {
                // 실제로는 신고 기능 구현
                alert('112(경찰청) 또는 1332(금융감독원)로 신고하세요.');
              }}
            >
              <Text style={styles.reportButtonText}>🚨 신고하기</Text>
            </TouchableOpacity>
          )}
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
    padding: 25,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callerNumber: {
    fontSize: 16,
    color: '#E8F4F8',
  },
  content: {
    padding: 20,
  },
  resultBox: {
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  scoreHigh: {
    color: '#E74C3C',
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  evidenceItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  evidenceBullet: {
    fontSize: 16,
    color: '#4A90E2',
    marginRight: 10,
    fontWeight: 'bold',
  },
  evidenceText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scamTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scamTypeTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  scamTypeText: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  actionBullet: {
    fontSize: 16,
    color: '#50C878',
    marginRight: 10,
    fontWeight: 'bold',
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: '#E74C3C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 50,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

