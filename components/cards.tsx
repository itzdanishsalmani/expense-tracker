import { Pressable, Text, View } from "react-native";

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
            backgroundColor: "#fff",
            padding: 20,
            margin: 10,
            borderRadius: 12,
            borderWidth:0.5,
            borderColor:'#E5E7EB',
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center'
        }}>
          <View>

            <Text style={{fontSize: 18, fontWeight: "bold"}}>{merchant}</Text>
            <View
            style={{flexDirection:'row', gap:8, paddingTop:4}}
            >
            <Text>{date}</Text>
            <Text>{category}</Text>
            </View>
          </View>
            <Text>{amount}</Text>

        </View>
    </Pressable>
  );
}
