import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import * as Clipboard from 'expo-clipboard';

export default function App() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('checking...');

  const addLog = (type, content) => {
    const entry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      content,
    };
    setLogs((prev) => [entry, ...prev]);
  };

  const requestUserPermission = async (messagingInstance) => {
    try {
      // 1. Android 13+ runtime POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionStatus('Granted (Android 13+)');
        } else {
          setPermissionStatus('Denied (Android 13+)');
          addLog('ERROR', 'Android 13+ POST_NOTIFICATIONS permission denied.');
          return false;
        }
      }

      // 2. Firebase native notification permission
      const authStatus = await requestPermission(messagingInstance);
      const enabled = authStatus === 1 || authStatus === 2; // 1 = AUTHORIZED, 2 = PROVISIONAL

      setPermissionStatus(enabled ? `Authorized (${authStatus})` : `Not Authorized (${authStatus})`);
      return enabled;
    } catch (err) {
      addLog('ERROR', 'Permission error: ' + (err.message || String(err)));
      return false;
    }
  };

  const fetchToken = async (messagingInstance) => {
    try {
      setLoading(true);
      const fcmToken = await getToken(messagingInstance);
      if (fcmToken) {
        setToken(fcmToken);
        addLog('TOKEN', fcmToken);
      } else {
        addLog('ERROR', 'No token returned by Firebase.');
      }
    } catch (err) {
      addLog('ERROR', 'Failed to retrieve FCM token: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeOpened = () => {};
    let unsubscribeForeground = () => {};
    let unsubscribeRefresh = () => {};

    const setup = async () => {
      try {
        const messagingInstance = getMessaging();

        await requestUserPermission(messagingInstance);
        await fetchToken(messagingInstance);

        // Check if app was opened by tapping a notification from quit state
        const initialNotification = await getInitialNotification(messagingInstance);
        if (initialNotification) {
          addLog(
            'INITIAL',
            `Opened from quit: ${JSON.stringify(
              initialNotification.notification || initialNotification.data
            )}`
          );
        }

        // App opened from background by tapping a notification
        unsubscribeOpened = onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
          addLog(
            'OPENED',
            `Tapped from background: ${JSON.stringify(
              remoteMessage.notification || remoteMessage.data
            )}`
          );
          Alert.alert(
            remoteMessage.notification?.title || 'Notification Clicked',
            remoteMessage.notification?.body || 'User tapped notification from background'
          );
        });

        // App receives a notification in the FOREGROUND
        unsubscribeForeground = onMessage(messagingInstance, async (remoteMessage) => {
          addLog(
            'FOREGROUND',
            `Foreground: ${remoteMessage.notification?.title || 'No Title'} - ${
              remoteMessage.notification?.body || 'No Body'
            }`
          );
          Alert.alert(
            `🔔 ${remoteMessage.notification?.title || 'New Message'}`,
            `${remoteMessage.notification?.body || ''}\n\nData: ${JSON.stringify(
              remoteMessage.data
            )}`
          );
        });

        // FCM device token refreshed
        unsubscribeRefresh = onTokenRefresh(messagingInstance, (newToken) => {
          setToken(newToken);
          addLog('TOKEN', `Refreshed: ${newToken}`);
        });
      } catch (e) {
        addLog('ERROR', 'Setup error: ' + (e.message || String(e)));
      }
    };

    setup();

    return () => {
      unsubscribeOpened();
      unsubscribeForeground();
      unsubscribeRefresh();
    };
  }, []);

  const copyToClipboard = async () => {
    if (!token) return;
    await Clipboard.setStringAsync(token);
    Alert.alert('Copied!', 'FCM token copied to clipboard.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>FCM Testing Client</Text>
          <Text style={styles.subtitle}>EAS Built Native Android PoC</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Permissions:</Text>
            <Text style={styles.value}>{permissionStatus}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Device FCM Token</Text>
            {loading && <ActivityIndicator size="small" color="#f59e0b" />}
          </View>
          <Text style={styles.tokenText} numberOfLines={4} selectable>
            {token || (loading ? 'Retrieving token...' : 'No token found')}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, !token && styles.disabledButton]}
              onPress={copyToClipboard}
              disabled={!token}
            >
              <Text style={styles.primaryButtonText}>📋 Copy Token</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                const messagingInstance = getMessaging();
                fetchToken(messagingInstance);
              }}
            >
              <Text style={styles.secondaryButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Event Logs</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No events recorded yet.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={[styles.badge, styles[`badge_${log.type}`] || styles.badge_DEFAULT]}>
                    {log.type}
                  </Text>
                  <Text style={styles.logTime}>{log.time}</Text>
                </View>
                <Text style={styles.logContent}>{log.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  label: { color: '#94a3b8', fontSize: 14 },
  value: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
  tokenText: {
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    fontSize: 12,
    color: '#cbd5e1',
    backgroundColor: '#090d16',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: '#f59e0b' },
  primaryButtonText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
  secondaryButton: { backgroundColor: '#334155' },
  secondaryButtonText: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  disabledButton: { opacity: 0.5 },
  emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' },
  logItem: {
    backgroundColor: '#090d16',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#ffffff',
    backgroundColor: '#475569',
  },
  badge_DEFAULT: { backgroundColor: '#475569' },
  badge_TOKEN: { backgroundColor: '#3b82f6' },
  badge_FOREGROUND: { backgroundColor: '#10b981' },
  badge_OPENED: { backgroundColor: '#8b5cf6' },
  badge_INITIAL: { backgroundColor: '#ec4899' },
  badge_ERROR: { backgroundColor: '#ef4444' },
  logTime: { fontSize: 11, color: '#64748b' },
  logContent: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'System',
  },
});
