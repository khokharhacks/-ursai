import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { mobileWelcomeMessage } from '../src/welcome';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.brandMark}>
        <Text style={styles.brandLetter}>U</Text>
      </View>
      <Text style={styles.eyebrow}>URSAI FIELD</Text>
      <Text style={styles.title}>{mobileWelcomeMessage}</Text>
      <Text style={styles.body}>
        The mobile foundation is ready for future offline assignments, evidence capture, and
        logistics workflows.
      </Text>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Foundation preview</Text>
        <Text style={styles.noticeBody}>No production services are connected.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f1e9', paddingHorizontal: 28, paddingTop: 72 },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#174f3b',
    marginBottom: 48,
  },
  brandLetter: { color: '#ffffff', fontWeight: '800', fontSize: 22 },
  eyebrow: { color: '#174f3b', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  title: { color: '#17231f', fontSize: 42, lineHeight: 46, fontWeight: '600', marginTop: 14 },
  body: { color: '#637069', fontSize: 17, lineHeight: 26, marginTop: 20 },
  notice: { backgroundColor: '#e4ecdf', borderRadius: 14, padding: 20, marginTop: 36 },
  noticeTitle: { color: '#17231f', fontSize: 16, fontWeight: '700' },
  noticeBody: { color: '#637069', marginTop: 6 },
});
