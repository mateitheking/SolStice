import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

type SimpleLineChartProps = {
  values: number[];
};

type BarProps = {
  targetHeight: number;
  delay: number;
  intensity: number; // 0-1, used for color opacity
};

function AnimatedBar({ targetHeight, delay, intensity }: BarProps) {
  const anim = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: targetHeight,
      duration: 500,
      delay,
      useNativeDriver: false,
    }).start();
  }, [anim, targetHeight, delay]);

  // Color goes from muted (low) to vibrant emerald (high)
  const r = Math.round(16 + (10 - 16) * intensity);
  const g = Math.round(185 + (185 - 185) * intensity);
  const b = Math.round(129 + (129 - 129) * intensity);
  const opacity = 0.35 + 0.65 * intensity;
  const barColor = `rgba(16, 185, 129, ${opacity})`;

  return (
    <Animated.View
      style={{
        flex: 1,
        height: anim,
        borderRadius: 3,
        backgroundColor: barColor,
        marginHorizontal: 1,
      }}
    />
  );
}

export function SimpleLineChart({ values }: SimpleLineChartProps) {
  if (!values.length) {
    return <View style={{ height: 80 }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const latest = values[values.length - 1];
  const first = values[0];
  const change = ((latest - first) / first) * 100;
  const isUp = change >= 0;

  return (
    <View>
      <View style={{ height: 72, flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
        {values.map((point, index) => {
          const normalized = (point - min) / range;
          const targetHeight = Math.max(6, normalized * 64);
          return (
            <AnimatedBar
              key={`${point}-${index}`}
              targetHeight={targetHeight}
              delay={index * 25}
              intensity={normalized}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
          {values.length * 0.5}min ago → now
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isUp ? '#10B981' : '#F43F5E' }}>
          {isUp ? '↑ +' : '↓ '}{Math.abs(change).toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}
