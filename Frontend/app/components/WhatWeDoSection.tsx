import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, Text, View } from 'react-native';

type WhatWeDoItem = {
  title: string;
  description: string;
};

const ITEMS: WhatWeDoItem[] = [
  {
    title: 'AI Trading Engine',
    description:
      'Our models detect momentum, volatility, and liquidity shifts to execute high-conviction entries with risk-aware sizing.',
  },
  {
    title: 'On-chain Execution',
    description:
      'Signals are translated into fast Solana transactions with route-aware execution designed for low latency and reliability.',
  },
  {
    title: 'Secure Vault System',
    description:
      'Capital stays in a dedicated vault flow with transparent movements, controlled permissions, and clear balance visibility.',
  },
  {
    title: 'Autonomous AI Decisions',
    description:
      'The agent continuously reevaluates market structure and can BUY, SELL, or HOLD without manual intervention.',
  },
];

export function WhatWeDoSection() {
  const isPhone = Dimensions.get('window').width < 430;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const expanded = useRef(ITEMS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const hover = useRef(ITEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    expanded.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: idx === activeIndex ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [activeIndex, expanded]);

  useEffect(() => {
    hover.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: hoveredIndex === idx ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  }, [hoveredIndex, hover]);

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28 }}>
      <Text style={{ color: '#F8FAFC', fontSize: isPhone ? 30 : 38, lineHeight: isPhone ? 34 : 42, fontWeight: '900', marginBottom: 6 }}>
        What we do
      </Text>
      <Text style={{ color: '#94A3B8', fontSize: isPhone ? 13 : 14, marginBottom: 24 }}>Understand how the system works</Text>

      <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' }}>
        {ITEMS.map((item, idx) => {
          const expand = expanded[idx];
          const hoverGlow = hover[idx];

          const maxHeight = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 140],
          });
          const contentOpacity = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });
          const contentY = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          });
          const iconRotate = expand.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '90deg'],
          });
          const verticalOpacity = expand.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          });

          const titleColor = hoverGlow.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(226, 232, 240, 0.95)', 'rgba(103, 232, 249, 1)'],
          });

          return (
            <View key={item.title} style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Pressable
                onPress={() => setActiveIndex((prev) => (prev === idx ? -1 : idx))}
                onHoverIn={() => setHoveredIndex(idx)}
                onHoverOut={() => setHoveredIndex((prev) => (prev === idx ? null : prev))}
                style={{ paddingVertical: 20 }}
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: -8,
                    right: -8,
                    top: 8,
                    bottom: 8,
                    borderRadius: 14,
                    opacity: hoverGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }),
                    backgroundColor: '#22D3EE',
                  }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Animated.Text style={{ color: titleColor, fontSize: isPhone ? 22 : 26, lineHeight: isPhone ? 26 : 30, fontWeight: '700' }}>
                    {item.title}
                  </Animated.Text>

                  <Animated.View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: iconRotate }] }}>
                    <View style={{ position: 'absolute', width: 16, height: 2, borderRadius: 999, backgroundColor: '#A5B4FC' }} />
                    <Animated.View
                      style={{
                        position: 'absolute',
                        width: 2,
                        height: 16,
                        borderRadius: 999,
                        backgroundColor: '#A5B4FC',
                        opacity: verticalOpacity,
                      }}
                    />
                  </Animated.View>
                </View>

                <Animated.View
                  style={{
                    overflow: 'hidden',
                    maxHeight,
                    opacity: contentOpacity,
                    transform: [{ translateY: contentY }],
                  }}
                >
                  <Text style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 24, marginTop: 12, maxWidth: 860 }}>
                    {item.description}
                  </Text>
                </Animated.View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
