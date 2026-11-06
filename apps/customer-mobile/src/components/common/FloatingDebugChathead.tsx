import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { customerApi } from '../../services/customerApi';
import { getDetectedApiUrl } from '../../config/env';

const CHATHEAD_SIZE = 50;

export const FloatingDebugChathead: React.FC = () => {
  const {
    isLiveMode,
    setIsLiveMode,
    apiUrl,
    setApiUrl,
    isPollingEnabled,
    setIsPollingEnabled,
    pollingInterval,
    setPollingInterval,
    loginCustomer,
    verifyCustomerMpin,
    showToast,
    selectedOrderId,
    advanceOrderStatus,
    signOutCustomer,
    refetchOrders,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);
  const [healthStatus, setHealthStatus] = useState<{
    checking: boolean;
    alive: boolean | null;
    status: number;
    latencyMs: number;
    message?: string;
  }>({
    checking: false,
    alive: null,
    status: 0,
    latencyMs: 0,
  });

  const screen = Dimensions.get('window');
  const pan = useRef(new Animated.ValueXY({ x: screen.width - CHATHEAD_SIZE - 16, y: 120 })).current;

  // Track drag distance to differentiate between a tap and a drag
  const dragDistance = useRef(0);

  const checkHealth = useCallback(async (targetUrl: string = apiUrl) => {
    setHealthStatus((prev) => ({ ...prev, checking: true }));
    const res = await customerApi.checkHealth(targetUrl);
    setHealthStatus({
      checking: false,
      alive: res.alive,
      status: res.status,
      latencyMs: res.latencyMs,
      message: res.message,
    });
  }, [apiUrl]);

  useEffect(() => {
    setTempUrl(apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    if (isModalOpen) {
      checkHealth(apiUrl);
    }
  }, [isModalOpen, apiUrl, checkHealth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3;
      },
      onPanResponderGrant: () => {
        dragDistance.current = 0;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        dragDistance.current += Math.abs(gesture.dx) + Math.abs(gesture.dy);
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;

        // Snap to nearest edge (left or right)
        const snapX = currentX < screen.width / 2 ? 12 : screen.width - CHATHEAD_SIZE - 12;
        // Clamp Y within screen
        const clampedY = Math.max(60, Math.min(screen.height - CHATHEAD_SIZE - 80, currentY));

        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 6,
        }).start();

        // If moved less than 8px total, count as a tap!
        if (dragDistance.current < 8) {
          setIsModalOpen(true);
        }
      },
    })
  ).current;

  const handleSaveUrl = (newUrl: string) => {
    const clean = newUrl.trim().replace(/\/+$/, '');
    setApiUrl(clean);
    setTempUrl(clean);
    showToast(`API URL updated: ${clean}`);
    checkHealth(clean);
  };

  const handleQuickSeedLogin = async () => {
    try {
      showToast('Logging in as Seed Customer (user@example.com)...');
      const loginRes = await loginCustomer({ email: 'user@example.com', password: 'password' });
      if (loginRes.preAuthToken) {
        await verifyCustomerMpin('1234');
        showToast('Logged in as John Doe (CST-001)!');
        setIsModalOpen(false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Seed login failed');
    }
  };

  return (
    <>
      {/* Floating Messenger-Style Chathead */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          transform: pan.getTranslateTransform(),
          zIndex: 9999,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          className={`w-[50px] h-[50px] rounded-full items-center justify-center shadow-2xl border-2 ${
            isLiveMode ? 'bg-[#0f172a] border-[#22c55e]' : 'bg-[#18181b] border-[#eab308]'
          }`}
          style={{
            shadowColor: isLiveMode ? '#22c55e' : '#eab308',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
          }}
        >
          {/* Status Dot */}
          <View
            className={`w-2.5 h-2.5 rounded-full absolute top-1 right-1 border border-white ${
              isLiveMode ? 'bg-[#22c55e]' : 'bg-[#eab308]'
            }`}
          />
          {/* Inner Icon / Badge */}
          <Text className="text-sm">⚡</Text>
          <Text className="text-[8px] font-black tracking-tighter text-white uppercase mt-[-2px]">
            {isLiveMode ? 'LIVE' : 'MOCK'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Full Dev / Debug Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[88%] p-5 shadow-2xl">
            {/* Modal Handle */}
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-3" />

            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View>
                <Text className="text-lg font-extrabold text-gray-900 tracking-tight">
                  ParcelHub Dev &amp; API Tools
                </Text>
                <Text className="text-xs text-gray-400">
                  Network health, endpoint routing &amp; test state
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Text className="text-gray-500 font-bold text-base">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
              {/* 1. Mode Switch */}
              <View className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <Text className="text-xs font-bold text-gray-600 uppercase mb-2">
                  Operating Mode
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setIsLiveMode(true);
                      showToast('Switched to Live Backend API mode');
                    }}
                    className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 border ${
                      isLiveMode
                        ? 'bg-emerald-50 border-emerald-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                    <Text
                      className={`text-xs font-bold ${
                        isLiveMode ? 'text-emerald-700' : 'text-gray-600'
                      }`}
                    >
                      Live Backend API
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setIsLiveMode(false);
                      showToast('Switched to Mock / Offline mode');
                    }}
                    className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 border ${
                      !isLiveMode
                        ? 'bg-amber-50 border-amber-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <View className="w-2 h-2 rounded-full bg-amber-500" />
                    <Text
                      className={`text-xs font-bold ${
                        !isLiveMode ? 'text-amber-700' : 'text-gray-600'
                      }`}
                    >
                      Mock Offline
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Backend Health Status */}
              <View className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-gray-600 uppercase">
                    Backend Health Check
                  </Text>
                  <TouchableOpacity
                    onPress={() => checkHealth(apiUrl)}
                    disabled={healthStatus.checking}
                    className="px-2.5 py-1 rounded-md bg-white border border-gray-200"
                  >
                    <Text className="text-[11px] font-semibold text-[#215cd4]">
                      {healthStatus.checking ? 'Testing...' : 'Ping Now'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-2">
                  {healthStatus.checking ? (
                    <ActivityIndicator size="small" color="#215cd4" />
                  ) : (
                    <View
                      className={`w-3 h-3 rounded-full ${
                        healthStatus.alive
                          ? 'bg-emerald-500'
                          : healthStatus.alive === false
                          ? 'bg-rose-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                  <Text className="text-xs font-bold text-gray-800">
                    {healthStatus.alive
                      ? `Connected (${healthStatus.latencyMs}ms)`
                      : healthStatus.alive === false
                      ? 'Offline / Unreachable'
                      : 'Not checked yet'}
                  </Text>
                </View>
                {healthStatus.message && (
                  <Text className="text-[11px] text-gray-500 mt-1">
                    {healthStatus.message}
                  </Text>
                )}
              </View>

              {/* 3. API URL Settings */}
              <View className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <Text className="text-xs font-bold text-gray-600 uppercase mb-1">
                  API Base URL
                </Text>
                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    value={tempUrl}
                    onChangeText={setTempUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 h-10 border border-gray-300 rounded-xl px-3 bg-white text-xs font-mono text-gray-800"
                  />
                  <TouchableOpacity
                    onPress={() => handleSaveUrl(tempUrl)}
                    className="px-3.5 h-10 rounded-xl bg-[#215cd4] items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold">Save</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Presets */}
                <View className="flex-row flex-wrap gap-1.5 mt-1">
                  <TouchableOpacity
                    onPress={() => handleSaveUrl(getDetectedApiUrl())}
                    className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <Text className="text-[10.5px] font-semibold text-blue-700">
                      🎯 Auto-Detect
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSaveUrl('http://localhost:3000')}
                    className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200"
                  >
                    <Text className="text-[10.5px] font-semibold text-gray-700">
                      💻 Localhost:3000
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSaveUrl('http://10.0.2.2:3000')}
                    className="px-2 py-1 rounded-lg bg-gray-100 border border-gray-200"
                  >
                    <Text className="text-[10.5px] font-semibold text-gray-700">
                      🤖 Android 10.0.2.2
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. Polling Rate Configuration */}
              <View className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-gray-600 uppercase">
                    Order Polling Rate
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsPollingEnabled(!isPollingEnabled);
                      showToast(
                        !isPollingEnabled ? 'Active order polling ENABLED' : 'Order polling DISABLED'
                      );
                    }}
                    className={`px-2.5 py-1 rounded-md border ${
                      isPollingEnabled
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isPollingEnabled ? 'text-emerald-700' : 'text-gray-600'
                      }`}
                    >
                      {isPollingEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isPollingEnabled && (
                  <View className="flex-row gap-2 mt-1">
                    {[2, 5, 10].map((sec) => (
                      <TouchableOpacity
                        key={sec}
                        onPress={() => {
                          setPollingInterval(sec);
                          showToast(`Polling interval set to ${sec}s`);
                        }}
                        className={`flex-1 py-1.5 rounded-lg items-center border ${
                          pollingInterval === sec
                            ? 'bg-[#215cd4] border-[#215cd4]'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            pollingInterval === sec ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {sec}s
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 5. One-Tap Seed Customer Login */}
              <View className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <Text className="text-xs font-bold text-gray-600 uppercase mb-1">
                  Test Credentials
                </Text>
                <Text className="text-[11px] text-gray-400 mb-2">
                  Backend seed: user@example.com / password / MPIN 1234
                </Text>
                <TouchableOpacity
                  onPress={handleQuickSeedLogin}
                  className="w-full py-2.5 rounded-xl bg-[#215cd4] items-center justify-center shadow-sm"
                >
                  <Text className="text-white text-xs font-bold">
                    ⚡ One-Tap Login as Seed Customer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 6. Order Status Advancer (for Counter testing) */}
              <View className="mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <Text className="text-xs font-bold text-gray-600 uppercase mb-1">
                  Counter Workflow Simulator
                </Text>
                <Text className="text-[11px] text-gray-400 mb-2">
                  Advance active order ({selectedOrderId}) through staff counter steps:
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => advanceOrderStatus(selectedOrderId, 'AWAITING_PARCEL')}
                    className="flex-1 py-2 bg-blue-50 border border-blue-200 rounded-lg items-center"
                  >
                    <Text className="text-[10.5px] font-bold text-blue-800">
                      Deposit Paid
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => advanceOrderStatus(selectedOrderId, 'READY_TO_CLAIM')}
                    className="flex-1 py-2 bg-emerald-50 border border-emerald-200 rounded-lg items-center"
                  >
                    <Text className="text-[10.5px] font-bold text-emerald-800">
                      Parcel Arrived
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => advanceOrderStatus(selectedOrderId, 'CLAIMED')}
                    className="flex-1 py-2 bg-gray-100 border border-gray-300 rounded-lg items-center"
                  >
                    <Text className="text-[10.5px] font-bold text-gray-800">
                      Handover Complete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 7. Manual Refresh & Sign Out */}
              <View className="flex-row gap-2 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    refetchOrders();
                    showToast('Orders refreshed!');
                  }}
                  className="flex-1 py-3 bg-gray-100 rounded-xl items-center justify-center"
                >
                  <Text className="text-xs font-bold text-gray-700">
                    🔄 Refresh Orders
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    signOutCustomer();
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-rose-50 border border-rose-200 rounded-xl items-center justify-center"
                >
                  <Text className="text-xs font-bold text-rose-700">
                    🚪 Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

