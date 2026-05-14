import { Pressable, Text, View } from "react-native";

export default function Cards({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
        <View style={{
            backgroundColor: "lightblue",
            padding: 20,
            margin: 10,
            borderRadius: 10,
        }}>
            <Text style={{fontSize: 18, fontWeight: "bold"}}>{title}</Text>
            <Text>{description}</Text>

        </View>
    </Pressable>
  );
}
