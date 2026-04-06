import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type SimpleLineChartProps = {
  values: number[];
};

type BarProps = {
  targetHeight: number;
  delay: number;
};

function AnimatedBar({ targetHeight, delay }: BarProps) {
  const anim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: targetHeight,
      duration: 420,
      delay,
      useNativeDriver: false,
    }).start();
  }, [anim, targetHeight, delay]);

  return <Animated.View className="flex-1 rounded-none bg-[#111111]" style={{ height: anim }} />;
}

export function SimpleLineChart({ values }: SimpleLineChartProps) {
  if (!values.length) {
    return <View className="h-24" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return (
    <View className="h-28 flex-row items-end gap-1 mt-2">
      {values.map((point, index) => {
        const normalized = ((point - min) / range) * 100;
        const targetHeight = Math.max(8, normalized);

        return <AnimatedBar key={`${point}-${index}`} targetHeight={targetHeight} delay={index * 35} />;
      })}
    </View>
  );
}
