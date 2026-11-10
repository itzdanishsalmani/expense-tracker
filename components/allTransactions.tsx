import Cards from "@/components/cards";
import { getPaginatedTransactions, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View, FlatList, ActivityIndicator } from "react-native";
import { colors, typography } from "@/utils/theme";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORY_IDS as CATEGORIES, formatCategory } from "@/constants/categories";

export default function AllTransactions() {
  const [expenses, setExpenses] = useState<ParsedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;
  const [selectedExpense, setSelectedExpense] = useState<ParsedExpense | null>(null);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const loadTransactions = useCallback(async (currentOffset = 0) => {
    if (currentOffset === 0) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const transactions = await getPaginatedTransactions(LIMIT, currentOffset);
      if (Array.isArray(transactions)) {
        if (transactions.length < LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        if (currentOffset === 0) {
          setExpenses(transactions);
        } else {
          setExpenses(prev => [...prev, ...transactions]);
        }
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !isLoading) {
      const nextOffset = offset + LIMIT;
      setOffset(nextOffset);
      loadTransactions(nextOffset);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setHasMore(true);
      loadTransactions(0);
    }, [loadTransactions])
  );

  const handleCategoryChange = async (category: ParsedExpense["category"]) => {
    if (!selectedExpense) return;

    await updateTransactionCategory(selectedExpense.id, category);
    setExpenses((current) =>
      current.map((expense) =>
        expense.id === selectedExpense.id ? { ...expense, category } : expense
      )
    );
    setSelectedExpense(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          backgroundColor: colors.background,
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ ...typography.section, color: colors.text }}>All Transactions</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.brand }}>Loading transactions...</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.textMuted }}>No transactions found.</Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <Cards
                merchant={item.merchant !== "Unknown" ? item.merchant : "Unknown"}
                category={item.category}
                amount={`Rs. ${item.amount}`}
                date={`${new Date(item.date).toLocaleDateString([], {
                  day: "2-digit",
                  month: "short",
                })} ${new Date(item.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
                onPress={() => setSelectedExpense(item)}
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingMore ? (
                <ActivityIndicator size="small" color={colors.brand} style={{ marginVertical: 20 }} />
              ) : <View style={{ height: 24 }} />
            }
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={selectedExpense !== null}
        onRequestClose={() => setSelectedExpense(null)}
      >
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay }}
          onPress={() => setSelectedExpense(null)}
        >
          <Pressable style={{ backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
            <Text style={{ ...typography.section, marginBottom: 18, color: colors.text }}>Edit category</Text>
            {CATEGORIES.map((category) => {
              const isSelected = selectedExpense?.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => handleCategoryChange(category)}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    marginBottom: 10,
                    backgroundColor: isSelected ? colors.brand : colors.surfaceMuted,
                  }}
                >
                  <Text style={{ ...typography.label, color: isSelected ? "white" : colors.text }}>
                    {formatCategory(category)}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
