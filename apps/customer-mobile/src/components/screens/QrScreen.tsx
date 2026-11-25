import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { useCustomerOrderDetailQuery } from '../../query/useCustomerQueries';
import { ArrowLeftIcon, DownloadIcon } from '../common/Icons';
import { CARD_SHADOW } from '../common/cardStyles';
import { ReturnHomeLink } from '../orders/OrderDetailPrimitives';
import { QrCodeFrame } from '../orders/QrCodeFrame';

export const QrScreen: React.FC = () => {
  const { authToken } = useAuthSession();
  const {
    selectedOrderId,
    selectedOrderTicketCode,
    navigateTo,
    goBack,
  } = useNavigationUi();
  const { showToast } = useToast();
  const { orders } = useCustomerOrders();
  const { data: orderDetail, refetch } = useCustomerOrderDetailQuery(authToken, selectedOrderId);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const qrSvgRef = useRef<any>(null);

  // Handle hardware back on Android: return to previous screen
  useEffect(() => {
    const onBackPress = () => {
      goBack();
      return true;
    };
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [goBack]);

  const cachedSummary = orders.find(
    (o) => o.id === selectedOrderId || o.ticketCode === selectedOrderId
  );

  const handlePullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refetch]);

  const ticketCode =
    selectedOrderTicketCode || orderDetail?.ticketCode || cachedSummary?.ticketCode;
  const orderId = orderDetail?.id || cachedSummary?.id || selectedOrderId || '';

  // Encode ticketCode if present (e.g. 941-53N), falling back to UUID order.id
  const qrValue = ticketCode || orderId || 'PARCELHUB-DEMO';
  // If ticketCode isn't loaded yet, show '...' rather than flashing the raw UUID
  const displayTicket = ticketCode || (orderDetail ? orderId : '...');

  const handleSavePhoto = async () => {
    if (isSavingPass) return;

    if (!qrSvgRef.current || typeof qrSvgRef.current.toDataURL !== 'function') {
      showToast('QR code is still preparing. Please try again.');
      return;
    }

    setIsSavingPass(true);
    showToast('Saving pickup pass to gallery...');

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showToast('Permission to access photo gallery was denied.');
        setIsSavingPass(false);
        return;
      }

      qrSvgRef.current.toDataURL(async (base64Data: string) => {
        try {
          const cleanBase64 = base64Data
            .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
            .trim();
          const filename = `${FileSystem.cacheDirectory}parcelhub_pass_${ticketCode || 'qr'}.png`;

          await FileSystem.writeAsStringAsync(filename, cleanBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Save to device photo gallery (supports both modern Asset.create and legacy)
          if ((MediaLibrary as any).Asset?.create) {
            await (MediaLibrary as any).Asset.create(filename);
          } else {
            const legacy = await import('expo-media-library/legacy');
            await legacy.saveToLibraryAsync(filename);
          }

          showToast('Pickup QR pass saved to photo gallery!');
        } catch (innerErr: any) {
          showToast(innerErr?.message || 'Failed to save pass to gallery.');
        } finally {
          setIsSavingPass(false);
        }
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to save pass to gallery.');
      setIsSavingPass(false);
    }
  };

  const handleCopyTicket = async () => {
    if (!displayTicket || displayTicket === '---') return;
    try {
      await Clipboard.setStringAsync(displayTicket);
      showToast(`Copied Ticket (${displayTicket}) to clipboard!`);
    } catch {
      showToast('Failed to copy ticket to clipboard.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#215CD4' }} className="flex-1 bg-[#215CD4]">
      <StatusBar style="light" />

      {/* Curved Top App Bar / Technical Precision Header */}
      <View
        style={{
          backgroundColor: '#215CD4',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          paddingTop: 40,
          paddingHorizontal: 20,
          paddingBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header Row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
            width: '100%',
            height: 40,
          }}
        >
          {/* Button - Go Back */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={goBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            accessibilityLabel="Go Back"
          >
            <ArrowLeftIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Centered Screen Title Header */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                fontSize: 20,
                lineHeight: 28,
                letterSpacing: -0.5,
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              Generated QR
            </Text>
            <Text
              style={{
                fontWeight: '500',
                fontSize: 12,
                lineHeight: 16,
                letterSpacing: 0.3,
                color: 'rgba(219, 234, 254, 0.9)',
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              Ready to Scan
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content Container with Top Rounded Corners */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#F1F5F9',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: 'hidden',
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isPullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor="#215CD4"
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        >
          {/* Section - Minimalist Verification Pass Card */}
          <View
            className="bg-white border border-[#edf2f7] rounded-[20px] p-5 items-center"
            style={CARD_SHADOW}
          >
            {/* Tappable Ticket Header */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopyTicket}
              className="w-full pb-4 border-b border-[#f1f5f9] items-center"
              accessibilityLabel="Copy Ticket ID"
            >
              <Text className="text-[11px] font-bold text-[#94a3b8] tracking-[0.65px] uppercase">
                TICKET
              </Text>
              <Text className="font-mono text-[18px] font-bold text-[#0f172a] mt-1 tracking-[0.5px]">
                {displayTicket}
              </Text>
            </TouchableOpacity>

            {/* Padded Square QR Frame */}
            <QrCodeFrame
              value={qrValue}
              getRef={(c) => {
                qrSvgRef.current = c;
              }}
            />

            {/* Explanatory Instructions */}
            <Text className="text-[12.5px] font-normal text-[#64748b] text-center leading-[18px] max-w-[260px]">
              Show this QR pass at the hub counter when requested by staff.
            </Text>
          </View>

          {/* Footer - Action Button Group */}
          <View style={{ marginTop: 24, gap: 12, width: '100%', alignItems: 'center' }}>
            {/* Save Pass to Gallery Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSavePhoto}
              disabled={isSavingPass}
              style={{
                width: '100%',
                paddingVertical: 15,
                paddingHorizontal: 21,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(33, 92, 212, 0.15)',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#215CD4',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {isSavingPass ? (
                <ActivityIndicator size="small" color="#215CD4" />
              ) : (
                <>
                  <DownloadIcon size={16} color="#215CD4" strokeWidth={1.33} />
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#1E1E1E',
                      textAlign: 'center',
                    }}
                  >
                    Save Pass to Gallery
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Return to Home Navigation Link */}
            <ReturnHomeLink onPress={() => navigateTo('home')} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default QrScreen;
