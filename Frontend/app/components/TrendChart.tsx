import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

type TrendChartProps = {
  values: number[];
  height?: number;
  lineColor?: string;
};

type Point = { x: number; y: number };

function buildSmoothPath(points: Point[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  path += ` T ${last.x} ${last.y}`;
  return path;
}

export function TrendChart({ values, height = 220, lineColor = '#67E8F9' }: TrendChartProps) {
  const [width, setWidth] = useState(0);
  const safeValues = values.length > 1 ? values : [0, 0];

  const points = useMemo(() => {
    if (width <= 0) return [];
    const paddingX = 10;
    const chartW = Math.max(40, width - paddingX * 2);
    const min = Math.min(...safeValues);
    const max = Math.max(...safeValues);
    const range = Math.max(1, max - min);

    return safeValues.map((value, idx) => {
      const x = paddingX + (idx / (safeValues.length - 1)) * chartW;
      const y = 12 + ((max - value) / range) * (height - 30);
      return { x, y };
    });
  }, [height, safeValues, width]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;
  }, [height, linePath, points]);

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="rgba(148, 163, 184, 0.16)" strokeWidth={1} />
          <Path d={areaPath} fill="url(#trendFill)" />
          <Path d={linePath} stroke={lineColor} strokeWidth={3} fill="none" />
          <Path d={linePath} stroke={lineColor} strokeOpacity={0.2} strokeWidth={10} fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}
