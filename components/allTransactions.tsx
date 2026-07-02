import Cards from "@/components/cards";
import { getAllTransactions, updateTransactionCategory } from "@/utils/db";
import { ParsedExpense } from "@/utils/smsParser";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, Text } from "react-native";
import { colors, typography } from "@/utils/theme";

const CATEGORIES: ParsedExpense["category"][] = [
  "food",
  "travelling",
  "shopping",
  "others",
];

export default function AllTransactions() {
  const [expenses, setExpenses] = useState<ParsedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<ParsedExpense | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const transactions = await getAllTransactions();
      setExpenses(Array.isArray(transactions) ? transactions : []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
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
    <>
      <ScrollView style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
        {isLoading ? (
          <Text style={{ color: colors.brand }}>Loading transactions...</Text>
        ) : expenses.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>No transactions found.</Text>
        ) : (
          (expenses ?? []).map((item) => (
            <Cards
              key={item.id}
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
          ))
        )}
        <Text style={{ height: 24 }} />
      </ScrollView>

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
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
