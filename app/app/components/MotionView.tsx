import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

type MotionViewProps = PropsWithChildren<{
  delay?: number;
  style?: ViewStyle;
  className?: string;
}>;

export function MotionView({ children, delay = 0, style, className }: MotionViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View className={className} style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
