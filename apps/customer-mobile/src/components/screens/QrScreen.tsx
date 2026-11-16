import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../../context/AppContext';
import { ArrowLeftIcon, DownloadIcon } from '../common/Icons';

export const QrScreen: React.FC = () => {
  const { getCurrentOrder, copyToClipboard, navigateTo, showToast } = useApp();
  const order = getCurrentOrder();

  const handleSavePhoto = () => {
    showToast('Pickup QR pass saved to device photo storage!');
  };

  const handleCopyTicket = () => {
    copyToClipboard(order.id, 'Ticket');
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
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(241, 245, 249, 0.8)',
              borderRadius: 24,
              padding: 25,
              alignItems: 'center',
              shadowColor: '#215CD4',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 30,
              elevation: 4,
            }}
          >
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
                  value={order.id || 'PARCELHUB-DEMO'}
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
                {order.id}
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
