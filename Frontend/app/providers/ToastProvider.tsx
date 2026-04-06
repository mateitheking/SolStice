import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible ? (
        <View className="absolute left-4 right-4 top-14 z-50">
          <View
            className={`rounded-2xl px-4 py-3 border ${
              toast.type === 'success'
                ? 'bg-[#8BF4D5] border-[#6FE7C4]'
                : toast.type === 'error'
                  ? 'bg-[#FCA5A5] border-[#EF4444]'
                  : 'bg-[#CBD5E1] border-[#94A3B8]'
            }`}
          >
            <Text className="text-zinc-900 font-semibold">{toast.message}</Text>
          </View>
        </View>
      ) : null}
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
