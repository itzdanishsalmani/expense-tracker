import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, typography } from "@/utils/theme";
import { getCategoryDisplayName } from "@/constants/categories";

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 }}>
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${halfSize}, ${halfSize}`}>
                        {total === 0 ? (
                            <Circle
                                cx={halfSize}
                                cy={halfSize}
                                r={radius}
                                stroke={colors.border}
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
                            y={halfSize - 6}
                            textAnchor="middle"
                            fontSize="12"
                            fill={colors.textMuted}
                            fontWeight={typography.weight.medium}
                        >
                            Total
                        </SvgText>
                    )}
                    {total > 0 && (
                        <SvgText
                            x={halfSize}
                            y={halfSize + 14}
                            textAnchor="middle"
                            fontSize="16"
                            fill={colors.text}
                            fontWeight={typography.weight.bold}
                        >
                            {total > 1000 ? (total / 1000).toFixed(1) + 'k' : Math.round(total)}
                        </SvgText>
                    )}
                </Svg>
            </View>

            <View style={{ flex: 1, paddingLeft: 16 }}>
                {data.map((item, index) => {
                    if (item.value === 0 && total !== 0) return null;
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    
                    return (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 8 }} />
                            <Text style={{ fontSize: 10, color: colors.textMuted, flex: 1, fontWeight: '600' }}>
                                {getCategoryDisplayName(item.label)}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginRight: 12 }}>
                                {percentage}%
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.text, fontWeight: '500' }}>
                                Rs. {item.value >= 1000 ? (item.value / 1000).toFixed(1) + 'k' : Math.round(item.value)}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
