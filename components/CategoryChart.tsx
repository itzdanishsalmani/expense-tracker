import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface CategoryData {
    label: string;
    value: number;
    color: string;
}

interface CategoryChartProps {
    data: CategoryData[];
    size?: number;
    strokeWidth?: number;
}

export default function CategoryChart({ data, size = 180, strokeWidth = 30 }: CategoryChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const halfSize = size / 2;

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    let cumulativeValue = 0;

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${halfSize}, ${halfSize}`}>
                    {total === 0 ? (
                        <Circle
                            cx={halfSize}
                            cy={halfSize}
                            r={radius}
                            stroke="#E0E0E0"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                    ) : (
                        data.map((item, index) => {
                            if (item.value <= 0) return null;

                            const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
                            const strokeDashoffset = -((cumulativeValue / total) * circumference);

                            cumulativeValue += item.value;

                            return (
                                <Circle
                                    key={index}
                                    cx={halfSize}
                                    cy={halfSize}
                                    r={radius}
                                    stroke={item.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    fill="transparent"
                                />
                            );
                        })
                    )}
                </G>
                {total > 0 && (
                    <SvgText
                        x={halfSize}
                        y={halfSize - 10}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#666"
                        fontWeight="500"
                    >
                        Total
                    </SvgText>
                )}
                {total > 0 && (
                    <SvgText
                        x={halfSize}
                        y={halfSize + 12}
                        textAnchor="middle"
                        fontSize="18"
                        fill="#333"
                        fontWeight="bold"
                    >
                        {total > 1000 ? (total / 1000).toFixed(1) + 'k' : Math.round(total)}
                    </SvgText>
                )}
            </Svg>

            <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
                {data.map((item, index) => {
                    if (item.value === 0 && total !== 0) return null;
                    return (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginVertical: 4 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 6 }} />
                            <Text style={{ fontSize: 13, color: '#555' }}>
                                {item.label} (₹{Math.round(item.value)})
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
