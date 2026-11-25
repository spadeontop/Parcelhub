import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Easing,
  AppState,
  Linking,
  Platform,
  BackHandler,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, scanFromURLAsync } from 'expo-camera';
import type { BarcodeType } from 'expo-camera';
import type { StaffQrLookupResult } from '../services/staffApi';
import type { StaffOrder } from '../types';

const SCREEN_HEIGHT = Dimensions.get('window').height || 800;
export const QR_TYPES: BarcodeType[] = ['qr'];
export const QR_SCANNER_SETTINGS = { barcodeTypes: QR_TYPES };
export const IS_ANDROID = Platform.OS === 'android';
export const CAN_UPLOAD_QR = IS_ANDROID || Platform.OS === 'web';

type CameraPermission = Awaited<ReturnType<typeof Camera.getCameraPermissionsAsync>>;

interface UseQrScanControllerArgs {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: StaffOrder, hasDetails: boolean) => void;
  findOrderByQrCode: (code: string, signal: AbortSignal) => Promise<StaffQrLookupResult>;
}

export function useQrScanController({
  isOpen,
  onClose,
  onSelectOrder,
  findOrderByQrCode,
}: UseQrScanControllerArgs) {
  const [rendered, setRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [permission, setPermission] = useState<CameraPermission | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activity, setActivity] = useState<'uploading' | 'searching' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const sheetSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const isClosingRef = useRef(false);
  const attemptRef = useRef<AbortController | null>(null);

  const cameraIsVisible =
    IS_ANDROID &&
    isOpen &&
    !isClosing &&
    appState === 'active' &&
    !!permission?.granted &&
    !cameraError &&
    !activity &&
    !notice;

  useLayoutEffect(() => {
    if (!isOpen) return;
    setActivity(null);
    setNotice(null);
    setCameraError(null);
    return () => {
      attemptRef.current?.abort();
      attemptRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!IS_ANDROID || !isOpen) return;
    setAppState(AppState.currentState);
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, [isOpen]);

  useEffect(() => {
    if (!IS_ANDROID || !isOpen || appState !== 'active') return;
    let current = true;
    Camera.getCameraPermissionsAsync().then(
      (status) => {
        if (current) setPermission(status);
      },
      () => {
        if (current) setCameraError('Could not check camera access.');
      }
    );
    return () => {
      current = false;
    };
  }, [isOpen, appState]);

  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setIsClosing(false);
      setRendered(true);
      sheetSlideAnim.setValue(SCREEN_HEIGHT);
      Animated.timing(sheetSlideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (rendered && !isClosingRef.current) {
      Animated.timing(sheetSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    attemptRef.current?.abort();
    attemptRef.current = null;

    if (scanLoopRef.current) {
      scanLoopRef.current.stop();
      scanLoopRef.current = null;
    }

    Animated.timing(sheetSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        onClose();
      }
    });
  }, [onClose, sheetSlideAnim]);

  useEffect(() => {
    if (!IS_ANDROID || !isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!cameraIsVisible) return;

    scanLineAnim.setValue(1);
    scanLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    scanLoopRef.current.start();

    return () => {
      if (scanLoopRef.current) {
        scanLoopRef.current.stop();
        scanLoopRef.current = null;
      }
    };
  }, [cameraIsVisible, scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 140],
  });

  const handleCameraAccess = async () => {
    try {
      setCameraError(null);
      if (permission?.canAskAgain === false && !permission.granted) {
        await Linking.openSettings();
        return;
      }
      const status = permission?.granted
        ? await Camera.getCameraPermissionsAsync()
        : await Camera.requestCameraPermissionsAsync();
      setPermission(status);
    } catch {
      setCameraError('Could not access the camera.');
    }
  };

  const searchScannedCode = async (code: string, attempt: AbortController) => {
    setActivity('searching');
    try {
      const result = await findOrderByQrCode(code, attempt.signal);
      if (attempt.signal.aborted) return;
      if (result.kind === 'found') {
        handleClose();
        onSelectOrder(result.order, result.hasDetails);
        return;
      }
      setNotice(
        result.kind === 'ambiguous'
          ? 'Multiple orders match this QR code. Use manual search to choose an order.'
          : 'No order matches this QR code.'
      );
    } catch {
      if (!attempt.signal.aborted) {
        setNotice('Could not search for the order. Check your connection and try again.');
      }
    } finally {
      if (!attempt.signal.aborted) setActivity(null);
    }
  };

  const beginAttempt = () => {
    if (!isOpen || isClosingRef.current || attemptRef.current) return null;
    const attempt = new AbortController();
    attemptRef.current = attempt;
    return attempt;
  };

  const handleScan = (value: string) => {
    const code = value.trim();
    if (!cameraIsVisible || AppState.currentState !== 'active' || !code) return;
    const attempt = beginAttempt();
    if (attempt) void searchScannedCode(code, attempt);
  };

  const handleUploadQrImage = async () => {
    const attempt = beginAttempt();
    if (!attempt) return;
    setActivity('uploading');
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (attempt.signal.aborted) return;
      if (selection.canceled || !selection.assets[0]) {
        attemptRef.current = null;
        return;
      }

      const barcodes = await scanFromURLAsync(selection.assets[0].uri, QR_TYPES);
      if (attempt.signal.aborted) return;

      const codes = [...new Set(barcodes.map(({ data }) => data.trim()).filter(Boolean))];
      if (codes.length === 1) {
        await searchScannedCode(codes[0], attempt);
        return;
      }
      setNotice(
        codes.length === 0
          ? 'No readable QR code was found. Choose a clear image of the code.'
          : 'Multiple QR codes were found. Choose an image with one code.'
      );
    } catch {
      if (!attempt.signal.aborted) {
        setNotice('Could not read the selected image. Try another image.');
      }
    } finally {
      if (!attempt.signal.aborted) setActivity(null);
    }
  };

  const resetScanner = () => {
    attemptRef.current = null;
    setNotice(null);
  };

  const needsPermission = Boolean(permission && !permission.granted);
  let previewMessage = 'Getting the camera ready…';
  if (!IS_ANDROID) {
    previewMessage = CAN_UPLOAD_QR
      ? 'Choose a QR image to look up an order.'
      : 'Use manual search to find an order.';
  } else if (needsPermission) {
    previewMessage = 'Allow camera access to scan parcel QR codes.';
  }

  return {
    rendered,
    isClosing,
    permission,
    needsPermission,
    cameraError,
    setCameraError,
    activity,
    notice,
    cameraIsVisible,
    sheetSlideAnim,
    translateY,
    previewMessage,
    handleClose,
    handleCameraAccess,
    handleScan,
    handleUploadQrImage,
    resetScanner,
  };
}
