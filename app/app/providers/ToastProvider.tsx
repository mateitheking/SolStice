import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; dot: string; text: string }> = {
  success: { bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981', text: '#065F46' },
  error:   { bg: '#FFF1F2', border: '#FECDD3', dot: '#F43F5E', text: '#9F1239' },
  info:    { bg: '#F0F9FF', border: '#BAE6FD', dot: '#3B82F6', text: '#0C4A6E' },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [toast.visible, translateY, opacity]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const cfg = TOAST_CONFIG[toast.type];

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: 52,
          zIndex: 999,
          transform: [{ translateY }],
          opacity,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: cfg.bg,
          borderWidth: 1,
          borderColor: cfg.border,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cfg.dot }} />
          <Text style={{ flex: 1, fontWeight: '600', fontSize: 14, color: cfg.text }}>
            {toast.message}
          </Text>
        </View>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
