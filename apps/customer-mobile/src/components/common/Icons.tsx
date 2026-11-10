import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

export const HomeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 110 104" fill="none">
    <Path
      d="M3 52.516L50.7547 4.756C53.1013 2.41467 56.8987 2.41467 59.24 4.756L107 52.516M15 40.516V94.516C15 97.828 17.688 100.516 21 100.516H43V74.516C43 71.204 45.688 68.516 49 68.516H61C64.312 68.516 67 71.204 67 74.516V100.516H89C92.312 100.516 95 97.828 95 94.516V40.516M35 100.516H79"
      stroke={color}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const OrdersIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 94 110" fill="none">
    <Path
      d="M31 55H51M31 71H51M31 87H51M67 91H79C82.1826 91 85.2348 89.7357 87.4853 87.4853C89.7357 85.2348 91 82.1826 91 79V23.576C91 17.5227 86.4933 12.3867 80.4613 11.8853C78.4666 11.7199 76.47 11.5777 74.472 11.4587M43.5333 11.4587C44.2908 9.00906 45.8127 6.86632 47.8761 5.34421C49.9394 3.8221 52.436 3.0006 55 3H63C68.3973 3 72.9627 6.56267 74.472 11.4587C74.8259 12.6058 75.0004 13.7995 75 15C75 16.0609 74.5786 17.0783 73.8284 17.8284C73.0783 18.5786 72.0609 19 71 19H47C44.792 19 43 17.208 43 15C43 13.768 43.1867 12.5787 43.5333 11.4587ZM43.5333 11.4587C41.528 11.5813 39.5333 11.7253 37.5387 11.8853C31.5067 12.3867 27 17.5227 27 23.576V35M27 35H9C5.688 35 3 37.688 3 41V101C3 104.312 5.688 107 9 107H61C64.312 107 67 104.312 67 101V41C67 37.688 64.312 35 61 35H27ZM19 55H19.0427V55.0427H19V55ZM19 71H19.0427V71.0427H19V71ZM19 87H19.0427V87.0427H19V87Z"
      stroke={color}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HelpIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 102 102" fill="none">
    <Path
      d="M39.688 27.1013C45.9333 21.6347 56.0667 21.6347 62.312 27.1013C68.5627 32.568 68.5627 41.432 62.312 46.8987C61.2293 47.8533 60.0187 48.6373 58.7387 49.256C54.7653 51.1813 51.0053 54.584 51.0053 59V63M99 51C99 57.3035 97.7585 63.5452 95.3462 69.3688C92.934 75.1924 89.3983 80.4839 84.9411 84.9411C80.4839 89.3983 75.1924 92.934 69.3688 95.3462C63.5452 97.7585 57.3035 99 51 99C44.6966 99 38.4548 97.7585 32.6312 95.3462C26.8076 92.934 21.5161 89.3983 17.0589 84.9411C12.6017 80.4839 9.06601 75.1924 6.65378 69.3688C4.24156 63.5452 3 57.3035 3 51C3 38.2696 8.05713 26.0606 17.0589 17.0589C26.0606 8.05713 38.2696 3 51 3C63.7304 3 75.9394 8.05713 84.9411 17.0589C93.9429 26.0606 99 38.2696 99 51ZM51 79H51.0427V79.0427H51V79Z"
      stroke={color}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ProfileIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 86 110" fill="none">
    <Path
      d="M62.9947 23C62.9947 28.3043 60.8875 33.3914 57.1368 37.1421C53.3861 40.8929 48.299 43 42.9947 43C37.6903 43 32.6033 40.8929 28.8525 37.1421C25.1018 33.3914 22.9947 28.3043 22.9947 23C22.9947 17.6957 25.1018 12.6086 28.8525 8.85786C32.6033 5.10714 37.6903 3 42.9947 3C48.299 3 53.3861 5.10714 57.1368 8.85786C60.8875 12.6086 62.9947 17.6957 62.9947 23ZM3 98.296C3.17139 87.8019 7.46047 77.7955 14.9423 70.4349C22.4241 63.0743 32.4991 58.9492 42.9947 58.9492C53.4902 58.9492 63.5653 63.0743 71.0471 70.4349C78.5289 77.7955 82.818 87.8019 82.9893 98.296C70.4421 104.049 56.7981 107.019 42.9947 107C28.7227 107 15.176 103.885 3 98.296Z"
      stroke={color}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const QrCodeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      stroke={color}
      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
    />
  </Svg>
);

export const CopyIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      stroke={color}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#9ca3af' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke={color} d="M9 5l7 7-7 7" />
  </Svg>
);

export const ArrowLeftIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#1f2937' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      stroke={color}
      d="M19 12H5M12 19l-7-7 7-7"
    />
  </Svg>
);

export const BackArrowIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#374151' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      stroke={color}
      d="M3 10h10a5 5 0 0 1 5 5v2m-15-7l4-4m-4 4l4 4"
    />
  </Svg>
);

export const BackspaceIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#374151' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      stroke={color}
      d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
    />
    <Line x1="18" y1="9" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="18" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EyeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#374151' }) => (
:  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="12"
      r="3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const EyeOffIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#374151' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="1"
      y1="1"
      x2="23"
      y2="23"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CloseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke={color} d="M6 18L18 6M6 6l12 12" />
  </Svg>
);

export const ParcelHubLogoSvg: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Path d="M50 10L86 31V73L50 94L14 73V31L50 10Z" fill="#215CD4" />
    <Path d="M50 10L86 31L50 52L14 31L50 10Z" fill="#3B82F6" />
    <Path d="M14 31L50 52V94L14 73V31Z" fill="#1D4ED8" />
    <Path d="M86 31L50 52V94L86 73V31Z" fill="#1E40AF" />
    <Path
      d="M50 20L75 34.5V64.5L50 79L25 64.5V34.5L50 20Z"
      stroke="#FFFFFF"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M50 20V79M25 34.5L50 49L75 34.5"
      stroke="#FFFFFF"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


export const BellIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckIcon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 24,
  color = '#059669',
  strokeWidth = 2.5,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ClockIcon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 24,
  color = '#ef4444',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RefreshIcon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 18,
  color = '#ffffff',
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 4V10H17M1 20V14H7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.51 9A9 9 0 0 1 18.36 5.64L23 10M1 14L5.64 18.36A9 9 0 0 0 20.49 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DownloadIcon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 16,
  color = '#215CD4',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
