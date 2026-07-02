import { getTransactionsByDateRange, initDB, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import DateTimePicker from "@react-native-community/datetimepicker";
import Fontisto from "@expo/vector-icons/Fontisto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { compareAsc, compareDesc, endOfMonth, format, startOfMonth } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors, typography } from "@/utils/theme";

type MonthTransactionsParams = {
  monthKey: string;
  label: string;
};

const CATEGORIES: ParsedExpense["category"][] = ["food", "travelling", "shopping", "others"];
type CategoryFilter = "all" | ParsedExpense["category"];
type SortDirection = "desc" | "asc";

const formatCategory = (category: CategoryFilter) => (
  category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)
);

const formatDateKey = (timestamp: number) => {
  // Format as YYYY-MM-DD
  return format(new Date(timestamp), "yyyy-MM-dd");
};

const formatShortDate = (timestamp: number) => (
  format(new Date(timestamp), "dd-MMM")
);

const getCategoryIcon = (category: ParsedExpense["category"]) => {
  switch (category) {
    case "food":
      return { name: "shopping-basket", family: Fontisto, color: "#F59E0B" };
    case "travelling":
      return { name: "bus", family: Fontisto, color: "#2563EB" };
    case "shopping":
      return { name: "shopping-bag", family: Fontisto, color: "#EC4899" };
    default:
      return { name: "wallet", family: Fontisto, color: "#64748B" };
  }
};

export default function MonthTransactions() {
  const navigation = useNavigation();
  const route = useRoute();
  const { monthKey, label } = route.params as MonthTransactionsParams;
  const [transactions, setTransactions] = useState<ParsedExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string | "all">("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const availableDates = useMemo(() => {
    const dateMap = new Map<string, number>();

    transactions.forEach((item) => {
      const dateKey = formatDateKey(item.date);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, item.date);
      }
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => compareDesc(a[1], b[1]))
      .map(([key, timestamp]) => ({ key, label: formatShortDate(timestamp) }));
  }, [transactions]);

  const highestTransaction = useMemo(() => (
    transactions.reduce<ParsedExpense | null>(
      (highest, item) => (!highest || item.amount > highest.amount ? item : highest),
      null
    )
  ), [transactions]);

  const lowestTransaction = useMemo(() => (
    transactions.reduce<ParsedExpense | null>(
      (lowest, item) => (!lowest || item.amount < lowest.amount ? item : lowest),
      null
    )
  ), [transactions]);

  const filteredTransactions = useMemo(() => (
    transactions
      .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
      .filter((item) => {
        if (selectedDate === "all") return true;
        return formatDateKey(item.date) === selectedDate;
      })
      .sort((a, b) => (
        sortDirection === "desc"
          ? compareDesc(a.date, b.date)
          : compareAsc(a.date, b.date)
      ))
  ), [selectedCategory, selectedDate, sortDirection, transactions]);

  const filteredTotal = useMemo(() => (
    filteredTransactions.reduce((sum, item) => sum + item.amount, 0)
  ), [filteredTransactions]);


  // Helper to filter out transactions with duplicate amount and date
  const filterDuplicates = (txs: ParsedExpense[]) => {
    const seen = new Set<string>();
    return txs.filter((item) => {
      const key = `${item.amount}_${formatDateKey(item.date)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const refreshMonthTransactions = useCallback(async () => {
    await initDB();
    const [year, month] = monthKey.split("-").map(Number);
    // Use date-fns to get start and end of month
    const start = startOfMonth(new Date(year, month - 1)).getTime();
    const end = endOfMonth(new Date(year, month - 1)).getTime();
    const rows = await getTransactionsByDateRange(start, end);
    const filteredRows = filterDuplicates(rows);
    setTransactions(filteredRows);
    setTotal(filteredRows.reduce((sum, item) => sum + item.amount, 0));
  }, [monthKey]);

  useFocusEffect(
    useCallback(() => {
      const fetchMonthTransactions = async () => {
        try {
          await refreshMonthTransactions();
        } catch (err) {
          console.error("Error fetching month transactions:", err);
        }
      };

      fetchMonthTransactions();
    }, [refreshMonthTransactions])
  );

  const handleCategoryChange = async (id: string, category: ParsedExpense["category"]) => {
    await updateTransactionCategory(id, category);
    setTransactions((currentTransactions) =>
      currentTransactions.map((item) =>
        item.id === id ? { ...item, category } : item
      )
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 28 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 18,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={{ backgroundColor: colors.brand, padding: 18, borderRadius: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.label, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>Monthly overview</Text>
              <Text style={{ ...typography.title, color: "white", marginBottom: 6 }}>{label}</Text>
              <Text style={{ ...typography.body, color: "rgba(255,255,255,0.85)" }}>
                {filteredTransactions.length} of {transactions.length} transactions shown
              </Text>
            </View>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.15)",
            }}>
              <Fontisto name="wallet" size={24} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, padding: 18, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 18 }}>
          <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 8 }}>Month Total</Text>
          <Text style={{ ...typography.title, color: colors.text, marginBottom: 14 }}>Rs. {total.toFixed(2)}</Text>
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surfaceMuted, padding: 14, borderRadius: 14 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4 }}>Lowest spend</Text>
              <Text style={{ ...typography.section, color: colors.text, marginBottom: 4 }}>
                Rs. {lowestTransaction?.amount.toFixed(2)}
              </Text>
              <Text numberOfLines={1} style={{ ...typography.caption, color: colors.textMuted }}>
                {lowestTransaction?.merchant !== "Unknown" ? lowestTransaction?.merchant : lowestTransaction?.category}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceMuted, padding: 14, borderRadius: 14 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 4 }}>Highest paid</Text>
              <Text style={{ ...typography.section, color: colors.text, marginBottom: 4 }}>
                Rs. {highestTransaction?.amount.toFixed(2)}
              </Text>
              <Text numberOfLines={1} style={{ ...typography.caption, color: colors.textMuted }}>
                {highestTransaction?.merchant !== "Unknown" ? highestTransaction?.merchant : highestTransaction?.category}
              </Text>
            </View>
          </View>
        </View>

        {transactions.length > 0 && (
          <>
            <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View>
                  <Text style={{ ...typography.section, color: colors.text }}>Filters</Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>Showing Rs. {filteredTotal.toFixed(2)}</Text>
                </View>
                <Pressable
                  onPress={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: colors.brand,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name={sortDirection === "desc" ? "arrow-down" : "arrow-up"} size={14} color="white" />
                  <Text style={{ ...typography.button, color: "white" }}>
                    Date {sortDirection === "desc" ? "Desc" : "Asc"}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ ...typography.label, color: colors.text, marginBottom: 8 }}>Category</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {(["all", ...CATEGORIES] as CategoryFilter[]).map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <Pressable
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 18,
                        backgroundColor: isSelected ? colors.text : colors.surfaceMuted,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isSelected ? "white" : colors.brand }} />
                      <Text style={{ ...typography.caption, color: isSelected ? "white" : colors.text }}>
                        {formatCategory(category)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ ...typography.label, color: colors.text, marginBottom: 8 }}>Date</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: selectedDate === "all" ? colors.text : colors.surfaceMuted,
                    marginRight: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="calendar-outline" size={14} color={selectedDate === "all" ? "white" : colors.text} />
                  <Text style={{ ...typography.caption, color: selectedDate === "all" ? "white" : colors.text }}>
                    All dates
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    backgroundColor: selectedDate !== "all" ? colors.text : colors.surfaceMuted,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="funnel-outline" size={14} color={selectedDate !== "all" ? "white" : colors.text} />
                  <Text style={{ ...typography.caption, color: selectedDate !== "all" ? "white" : colors.text }}>
                    {selectedDate !== "all" ? format(new Date(selectedDate), "dd-MMM-yyyy") : "Pick a date"}
                  </Text>
                </Pressable>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate !== "all" ? new Date(selectedDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (event.type === "set" && date) {
                      setSelectedDate(formatDateKey(date.getTime()));
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </>
        )}

        {transactions.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16 }}>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: "center" }}>No transactions found for this month.</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={{ backgroundColor: colors.surface, padding: 20, borderRadius: 16 }}>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: "center" }}>No transactions match these filters.</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => (
            <View key={item.id} style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                <View style={{ flex: 1, flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
                    {(() => {
                      const icon = getCategoryIcon(item.category);
                      const IconComponent = icon.family;
                      return <IconComponent name={icon.name as any} size={16} color={icon.color} />;
                    })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: colors.text, marginBottom: 4 }}>
                      {item.merchant !== "Unknown" ? item.merchant : item.category.toUpperCase()}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      {format(new Date(item.date), "dd-MMM HH:mm")}
                    </Text>
                  </View>
                </View>
                <Text style={{ ...typography.label, color: colors.text }}>Rs. {item.amount.toFixed(2)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand }} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {item.category}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {format(new Date(item.date), "HH:mm")}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((category) => {
                  const isSelected = item.category === category;
                  return (
                    <Pressable
                      key={category}
                      onPress={() => handleCategoryChange(item.id, category)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 18,
                        backgroundColor: isSelected ? colors.brand : colors.surfaceMuted,
                      }}
                    >
                      <Text style={{ ...typography.caption, color: isSelected ? "white" : colors.text }}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
