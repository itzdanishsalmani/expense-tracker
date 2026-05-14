import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Details() {
  const router = useRouter();
  const { title, description, amount, date, merchant, category } = useLocalSearchParams();

  // Delete handler
  const handleDelete = async () => {
    // Remove from DB (or AsyncStorage)
    router.back();
  };

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>{title}</Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Amount: Rs. {amount}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Category: {category}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Merchant: {merchant}</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Date: {date ? new Date(Number(date)).toLocaleString() : ""}</Text>
      <Text style={{ fontSize: 14, marginBottom: 16, color: "#555" }}>{description}</Text>
      <Button title="Delete" color="red" onPress={handleDelete} />
    </View>
  );
}
