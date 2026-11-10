import { Pressable, Text, View } from "react-native";
import { colors, typography } from "@/utils/theme";
import { getCategoryDisplayName } from "@/constants/categories";

export default function Cards({
  merchant,
  category,
  amount,
  date,
  onPress,
}: {
 merchant: string,
  category: string,
  amount: string,
  date: string
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
        <View style={{
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: "#D3D3D3",
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center',
            marginVertical: 4,
        }}>
          <View>

            <Text style={{ ...typography.label, color: colors.text }}>{merchant}</Text>
            <View
            style={{flexDirection:'row', gap:8, paddingTop:4}}
            >
            <Text style={{ ...typography.caption, color: colors.textMuted }}>{date}</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>{getCategoryDisplayName(category)}</Text>
            </View>
          </View>
            <Text style={{ ...typography.label, color: colors.text }}>{amount}</Text>

        </View>
    </Pressable>
  );
}
