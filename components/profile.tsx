import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import CategoryChart from "./CategoryChart";
import { getAllTransactions, initDB } from "@/utils/db";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ParsedExpense } from "@/utils/smsParser";
import { colors, typography } from "@/utils/theme";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORY_COLORS, createEmptyCategoryData, formatCategory } from "@/constants/categories";

type MonthlyExpenseData = {
  key: string;
  label: string;
  total: number;
  categories: Record<string, number>;
};

const buildChartData = (categoryData: Record<string, number>) => (
  Object.entries(categoryData).map(([cat, val]) => ({
    label: formatCategory(cat),
    value: val,
    color: CATEGORY_COLORS[cat] || '#8E8E93'
  }))
);

const getMonthLabel = (date: Date) => (
  date.toLocaleDateString([], { month: "long", year: "numeric" })
);

export default function Profile() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [categoryData, setCategoryData] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseData[]>([]);
  const [totalParsed, setTotalParsed] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchAllExpenses = async () => {
        try {
          await initDB();
          const parsed = await getAllTransactions();
          setTotalParsed(parsed.length);

          const groupedCategories: Record<string, number> = createEmptyCategoryData();
          const groupedMonths = new Map<string, MonthlyExpenseData>();
          let total = 0;

          parsed.forEach((ex: ParsedExpense) => {
            const date = new Date(ex.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!groupedMonths.has(monthKey)) {
              groupedMonths.set(monthKey, {
                key: monthKey,
                label: getMonthLabel(date),
                total: 0,
                categories: createEmptyCategoryData(),
              });
            }

            const month = groupedMonths.get(monthKey)!;

            total += ex.amount;
            month.total += ex.amount;
            groupedCategories[ex.category] = (groupedCategories[ex.category] || 0) + ex.amount;
            month.categories[ex.category] = (month.categories[ex.category] || 0) + ex.amount;
          });

          setCategoryData(groupedCategories);
          setMonthlyData(Array.from(groupedMonths.values()).sort((a, b) => b.key.localeCompare(a.key)));
          setTotalSpent(total);
        } catch (err) {
          console.error("Error fetching historical SMS from DB for profile:", err);
        }
      }

      fetchAllExpenses();
    }, [])
  );

  const chartData = buildChartData(categoryData);

  return (
// Ensure this import is added at the top if it's missing, but I'll add the UI components first.

      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <LinearGradient
            colors={['#7C3AED', '#854be9ff', '#FFFFFF']}
            style={{ paddingTop: insets.top + 16, padding: 16, paddingBottom: 16 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
                <View>
                    <Text style={{ ...typography.title, color: '#FFFFFF', fontSize: 20 }}>Reports</Text>
                    <Text style={{ ...typography.body, color: '#E9D8FD', fontSize: 12 }}>Analytics and insights</Text>
                </View>
              

            <LinearGradient
                colors={['#7C3AED', '#7C3AED', '#A78BFA']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ marginTop: 20, padding: 16, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.label, color: "rgba(255,255,255,0.85)", marginBottom: 2, fontWeight: '400', fontSize: 12 }}>Insight</Text>
                  <Text style={{ ...typography.title, color: "white", marginBottom: 4, fontSize: 20 }}>Profile overview</Text>
                  <Text style={{ ...typography.body, color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                    {totalParsed} transactions analyzed
                  </Text>
                </View>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}>
                  <MaterialIcons name="auto-graph" size={22} color="#fff" />
                </View>
              </View>
            </LinearGradient>
        </LinearGradient>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ flex: 1 }} 
          contentContainerStyle={{ 
            padding: 16, 
            paddingBottom: insets.bottom > 0 ? insets.bottom + 80 : 90 
          }}
        >

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, padding: 14, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124, 58, 237, 0.1)', alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Fontisto name="wallet" size={14} color={colors.brand} />
            </View>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4, fontSize: 11 }}>Total Expense</Text>
            <Text style={{ ...typography.section, color: colors.text, fontSize: 18, marginBottom: 8 }}>Rs. {totalSpent.toFixed(2)}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 8 }}>
                    <Ionicons name="arrow-down" size={8} color="#22c55e" />
                    <Text style={{ color: '#22c55e', fontSize: 9, fontWeight: '600', marginLeft: 2 }}>12%</Text>
                </View>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>vs last month</Text>
            </View>
          </View>
          
          <View style={{ flex: 1, backgroundColor: colors.surface, padding: 14, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124, 58, 237, 0.1)', alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ionicons name="list-outline" size={16} color={colors.brand} />
            </View>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4, fontSize: 11 }}>Tracked Items</Text>
            <Text style={{ ...typography.section, color: colors.text, fontSize: 18, marginBottom: 8 }}>{totalParsed}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 8 }}>
                    <Ionicons name="arrow-up" size={8} color="#22c55e" />
                    <Text style={{ color: '#22c55e', fontSize: 9, fontWeight: '600', marginLeft: 2 }}>2 new</Text>
                </View>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>vs last month</Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ ...typography.section, color: colors.text, fontSize: 16 }}>Category Breakdown</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.brand} />
          </View>
          
          {chartData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
            <Text style={{ ...typography.body, textAlign: 'center', marginTop: 20, marginBottom: 20, color: colors.textMuted }}>No scanned expenses found.</Text>
          ) : (
            <CategoryChart data={chartData} size={140} strokeWidth={20} />
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ ...typography.section, color: colors.text, fontSize: 16 }}>Month Wise</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.brand} />
        </View>
        {monthlyData.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 40 }}>
            <Text style={{ ...typography.body, textAlign: 'center', color: colors.textMuted }}>No monthly expenses found.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, padding: 16, paddingTop: 30, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap:16, height: 100 }}>
              {(() => {
                // Reverse to show oldest to newest left to right, take last 6 months
                const chartMonths = [...monthlyData].reverse().slice(-6);
                const maxTotal = Math.max(...chartMonths.map(m => m.total), 1);
                
                return chartMonths.map((month, index) => {
                  const isActive = index === chartMonths.length - 1; // Highlight the latest month
                  const barHeight = (month.total / maxTotal) * 80;
                  const monthName = new Date(month.key + '-01').toLocaleString('default', { month: 'short' });
                  
                  return (
                    <View key={month.key} style={{ alignItems: 'center' }}>
                      <Pressable 
                        onPress={() => navigation.navigate("MonthTransactions", { monthKey: month.key, label: month.label })}
                        style={{
                          width: 28,
                          height: Math.max(barHeight, 4), // At least 4px tall
                          backgroundColor: isActive ? colors.brand : 'rgba(124, 58, 237, 0.3)',
                          borderRadius: 4,
                          marginBottom: 6
                        }}
                      />
                      <Text style={{ fontSize: 9, color: isActive ? colors.text : colors.textMuted, fontWeight: isActive ? '600' : '400' }}>
                        {monthName}
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        )}

    </ScrollView>
      </View>
  );
}
