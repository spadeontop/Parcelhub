import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import { useV1 } from '../../v1/context/V1Context';
import { CustomerOrderDetail, OrderStatus } from '../../v1/types/api';
import { ArrowLeftIcon, DownloadIcon, CheckIcon, ParcelHubLogoSvg } from '../common/Icons';

const isPaidProgression = (status?: string | null): boolean => {
  return status === 'AWAITING_PARCEL' || status === 'READY_TO_CLAIM' || status === 'CLAIMED';
};

const isUnpaidStatus = (status?: string | null): boolean => {
  return status === 'PAYMENT_REQUIRED' || status === 'PENDING_INITIALIZATION';
};

export const QrScreen: React.FC = () => {
  const {
    selectedOrderId,
    selectedOrderTicketCode,
    orders,
    fetchOrderDetail,
    refetchOrders,
    navigateTo,
    showToast,
  } = useV1();
  const [orderDetail, setOrderDetail] = useState<CustomerOrderDetail | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [isPassSaved, setIsPassSaved] = useState(false);
  const cardRef = useRef<any>(null);
  const qrSvgRef = useRef<any>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const cachedSummary = orders.find(
    (o) => o.id === selectedOrderId || o.ticketCode === selectedOrderId
  );

  const targetLookupId =
    selectedOrderId ||
    selectedOrderTicketCode ||
    cachedSummary?.id ||
    cachedSummary?.ticketCode ||
    '';

  const lastStatusRef = useRef<OrderStatus | null>(
    (cachedSummary?.status as OrderStatus) || null
  );
  const hasRedirectedRef = useRef(false);

  const handlePaidTransition = useCallback(
    (targetOrderId: string, targetTicketCode?: string | null) => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      refetchOrders().catch(() => {});
      navigateTo('order_details', {
        orderId: targetOrderId,
        ticketCode: targetTicketCode ?? undefined,
      });
    },
    [navigateTo, refetchOrders]
  );

  // 1. Polling every 5 seconds for order detail status changes
  useEffect(() => {
    if (!targetLookupId) return;

    let isMounted = true;
    let isFetching = false;

    const poll = async () => {
      if (isFetching || hasRedirectedRef.current) return;
      isFetching = true;
      try {
        const detail = await fetchOrderDetail(targetLookupId);
        if (!isMounted || hasRedirectedRef.current) return;
        setOrderDetail(detail);

        const newStatus = detail.status;
        const previousStatus = lastStatusRef.current;

        // Check if status transitioned from unpaid to paid
        if (isUnpaidStatus(previousStatus) && isPaidProgression(newStatus)) {
          handlePaidTransition(detail.id || targetLookupId, detail.ticketCode);
          return;
        }

        lastStatusRef.current = newStatus;
      } catch {
        // If network fetch fails, fallback gracefully to cached summary
      } finally {
        isFetching = false;
      }
    };

    // Initial fetch on mount
    poll();

    // Standard 5-second interval polling
    const pollInterval = setInterval(poll, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [targetLookupId, fetchOrderDetail, handlePaidTransition]);

  // 2. React to external order status updates (e.g. FCM foreground push triggering refetchOrders)
  useEffect(() => {
    if (hasRedirectedRef.current) return;
    const currentStatus = cachedSummary?.status;
    const previousStatus = lastStatusRef.current;

    if (isUnpaidStatus(previousStatus) && isPaidProgression(currentStatus)) {
      handlePaidTransition(
        cachedSummary?.id || targetLookupId,
        cachedSummary?.ticketCode || selectedOrderTicketCode
      );
    }
  }, [
    cachedSummary?.status,
    cachedSummary?.id,
    cachedSummary?.ticketCode,
    targetLookupId,
    selectedOrderTicketCode,
    handlePaidTransition,
  ]);

  const ticketCode =
    selectedOrderTicketCode || orderDetail?.ticketCode || cachedSummary?.ticketCode;
  const orderId = orderDetail?.id || cachedSummary?.id || selectedOrderId || '';

  // Encode ticketCode if present (e.g. 941-53N), falling back to UUID order.id
  const qrValue = ticketCode || orderId || 'PARCELHUB-DEMO';
  // If ticketCode isn't loaded yet, show '...' rather than flashing the raw UUID
  const displayTicket = ticketCode || (orderDetail ? orderId : '...');

  const handleSavePhoto = async () => {
    if (isSavingPass) return;

    setIsSavingPass(true);

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showToast('Permission to access photo gallery was denied.');
        setIsSavingPass(false);
        return;
      }

      let imageUri = '';

      // 1. Capture the pixel-perfect branded Pass Card View using react-native-view-shot
      if (cardRef.current) {
        try {
          imageUri = await captureRef(cardRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
        } catch {
          // If view capture fails or is unsupported on platform, fallback to QR SVG
        }
      }

      // 2. Fallback to raw QR SVG if captureRef didn't produce an imageUri
      if (!imageUri && qrSvgRef.current && typeof qrSvgRef.current.toDataURL === 'function') {
        await new Promise<void>((resolve, reject) => {
          qrSvgRef.current.toDataURL(async (base64Data: string) => {
            try {
              const cleanBase64 = base64Data
                .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
                .trim();
              const filename = `${FileSystem.cacheDirectory}parcelhub_pass_${ticketCode || 'qr'}.png`;

              await FileSystem.writeAsStringAsync(filename, cleanBase64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              imageUri = filename;
              resolve();
            } catch (innerErr) {
              reject(innerErr);
            }
          });
        });
      }

      if (!imageUri) {
        throw new Error('Failed to capture pass screenshot.');
      }

      // Save to device photo gallery (supports both modern Asset.create and legacy)
      if ((MediaLibrary as any).Asset?.create) {
        await (MediaLibrary as any).Asset.create(imageUri);
      } else {
        const legacy = await import('expo-media-library/legacy');
        await legacy.saveToLibraryAsync(imageUri);
      }

      // Trigger button feedback indicator state
      setIsPassSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setIsPassSaved(false);
      }, 3000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save pass to gallery.');
    } finally {
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
            onPress={() => navigateTo('home')}
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
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        >
          {/* Section - Elevated Verification Card (White Surface, 24px Radius) */}
          <View
            ref={cardRef}
            collapsable={false}
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(241, 245, 249, 0.8)',
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#215CD4',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 30,
              elevation: 4,
            }}
          >
            {/* Clean ParcelHub Brand Header inside Pass Card */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingBottom: 16,
                marginBottom: 4,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
                width: '100%',
              }}
            >
              <ParcelHubLogoSvg size={30} />
              <View>
                <Text
                  style={{
                    fontWeight: '800',
                    fontSize: 15,
                    lineHeight: 20,
                    letterSpacing: 0.5,
                    color: '#1E1E1E',
                  }}
                >
                  PARCELHUB
                </Text>
                <Text
                  style={{
                    fontWeight: '600',
                    fontSize: 10,
                    lineHeight: 14,
                    letterSpacing: 0.6,
                    color: '#215CD4',
                    textTransform: 'uppercase',
                  }}
                >
                  Official Pickup Pass
                </Text>
              </View>
            </View>

            {/* Scannable High-Contrast QR Code Area */}
            <View
              style={{
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <View
                style={{
                  width: 197,
                  height: 209,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                }}
              >
                <QRCode
                  getRef={(c) => {
                    qrSvgRef.current = c;
                  }}
                  value={qrValue}
                  size={172}
                  color="#0f172a"
                  backgroundColor="#ffffff"
                />
              </View>
            </View>

            {/* Ticket Identifier Container */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopyTicket}
              style={{
                marginTop: 16,
                width: '100%',
                borderWidth: 1,
                borderColor: 'rgba(33, 92, 212, 0.1)',
                borderRadius: 16,
                paddingVertical: 17,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Copy Ticket ID"
            >
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 11,
                  lineHeight: 16.5,
                  letterSpacing: 1.1,
                  textTransform: 'uppercase',
                  color: '#215CD4',
                  textAlign: 'center',
                }}
              >
                TICKET
              </Text>
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 20,
                  lineHeight: 28,
                  letterSpacing: 1,
                  color: '#1E1E1E',
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {displayTicket}
              </Text>
            </TouchableOpacity>

            {/* Explanatory Instructions */}
            <View style={{ paddingTop: 19.065, paddingHorizontal: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 21.13,
                  fontWeight: '400',
                  color: '#6B7280',
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                Please wait by the counter. Show this screen only if requested by staff.
              </Text>
            </View>
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
                backgroundColor: isPassSaved ? '#ECFDF5' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isPassSaved ? '#10B981' : 'rgba(33, 92, 212, 0.15)',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                shadowColor: isPassSaved ? '#10B981' : '#215CD4',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {isSavingPass ? (
                <>
                  <ActivityIndicator size="small" color="#215CD4" />
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#215CD4',
                      textAlign: 'center',
                    }}
                  >
                    Saving to Gallery...
                  </Text>
                </>
              ) : isPassSaved ? (
                <>
                  <CheckIcon size={18} color="#059669" strokeWidth={2.2} />
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      lineHeight: 20,
                      color: '#059669',
                      textAlign: 'center',
                    }}
                  >
                    Pass Saved to Gallery!
                  </Text>
                </>
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('home')}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontWeight: '500',
                  fontSize: 14,
                  lineHeight: 20,
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                Return to Home
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default QrScreen;
