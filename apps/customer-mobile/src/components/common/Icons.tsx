import React from 'react';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';

export const HomeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11L12 3L21 11V22C21 22.5523 20.5523 23 20 23H4C3.44772 23 3 22.5523 3 22V11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 23V15H14V23"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const OrdersIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4H16C17.1046 4 18 4.89543 18 6V21C18 22.1046 17.1046 23 16 23H4C2.89543 23 2 22.1046 2 21V6C2 4.89543 2.89543 4 4 4Z"
      stroke={color}
      strokeWidth="1.8"
    />
    <Path
      d="M6 4V2.25C6 1.55964 6.55964 1 7.25 1H12.75C13.4404 1 14 1.55964 14 2.25V4"
      stroke={color}
      strokeWidth="1.8"
    />
    <Path
      d="M5.5 10.5H14.5"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <Path
      d="M5.5 15H14.5"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <Path
      d="M5.5 19.5H10.5"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
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
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path
      d="M12 11.5C14.0711 11.5 15.75 9.82107 15.75 7.75C15.75 5.67893 14.0711 4 12 4C9.92893 4 8.25 5.67893 8.25 7.75C8.25 9.82107 9.92893 11.5 12 11.5Z"
      stroke={color}
      strokeWidth="1.8"
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

export const BackspaceIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const EyeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#374151' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

export const ParcelHubLogoSvg: React.FC<{ size?: number; style?: any }> = ({ size = 40, style }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" style={style}>
    <Rect width={512} height={512} rx={148} fill="#1E1E1E" />
    <Path
      d="M96 304V140C96 115.699 115.699 96 140 96H304"
      stroke="#FFFFFF"
      strokeWidth={64}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M416 208V372C416 396.301 396.301 416 372 416H208"
      stroke="#FFFFFF"
      strokeWidth={64}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x={176} y={176} width={160} height={160} rx={38} fill="#3B82F6" />
  </Svg>
);

export const LegacyParcelHubLogoSvg: React.FC<{ size?: number; style?: any }> = ({ size = 40, style }) => (
  <Svg width={size} height={size} viewBox="0 0 52 52" fill="none" style={style}>
    <Path
      d="M37 0H15C6.71573 0 0 6.71573 0 15V37C0 45.2843 6.71573 52 15 52H37C45.2843 52 52 45.2843 52 37V15C52 6.71573 45.2843 0 37 0Z"
      fill="#1E1E1E"
    />
    <Path d="M6 6H33V15H15V46H6V6Z" fill="#FFFFFF" />
    <Path d="M46 46H19V37H37V6H46V46Z" fill="#FFFFFF" />
    <Path d="M33 19H19V33H33V19Z" fill="#2563EB" />
  </Svg>
);


export const BellIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = '#215cd4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.5 17.8234H3.5C5.3 16.2705 6.5 14.1999 6.5 11.3529V7.4705C6.5 3.847 9.2 1 12.5 1C15.8 1 18.5 3.847 18.5 7.4705V11.3529C18.5 14.1999 19.7 16.2705 21.5 17.8234Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.25 21.7061C10.85 22.4825 11.6 23 12.5 23C13.4 23 14.15 22.4825 14.75 21.7061"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
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

export const PackageIcon: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({
  size = 22,
  color = '#2563eb',
  strokeWidth = 1.9,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7.5L12 3L4 7.5M20 7.5L12 12M20 7.5V16.5L12 21M12 12L4 7.5M12 12V21M4 7.5V16.5L12 21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
