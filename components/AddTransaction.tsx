import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/utils/theme';
import { insertTransactions } from '@/utils/db';
import uuid from 'react-native-uuid';
import { ParsedExpense } from '@/utils/smsParser';
import {
  CATEGORIES,
  CategoryOption,
  getCategoryConfig,
  getDefaultMerchant,
} from '@/constants/categories';

export default function AddTransaction() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [merchantName, setMerchantName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(true);

  const selectedCategoryObj = getCategoryConfig(category);

  const numericAmount = parseFloat(amount);
  const isAmountValid = !isNaN(numericAmount) && numericAmount > 0;

  const handleNumpadPress = (val: string) => {
    Keyboard.dismiss();
    setIsAmountFocused(true);

    if (val === 'backspace') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '.') {
      if (!amount.includes('.')) setAmount((prev) => prev + '.');
    } else {
      if (amount === '0') setAmount(val);
      else setAmount((prev) => prev + val);
    }
  };

  const handleSave = async () => {
    if (!isAmountValid) {
      return;
    }

    const finalMerchant = merchantName.trim() || getDefaultMerchant(category);

    const newExpense: ParsedExpense = {
      id: uuid.v4().toString(),
      amount: numericAmount,
      category: category as any,
      date: Date.now(),
      originalText: 'Manual entry',
      merchant: finalMerchant,
    };

    await insertTransactions([newExpense]);
    navigation.goBack();
  };

  const renderCategoryIcon = (
    cat: CategoryOption,
    size: number = 20,
    color: string = colors.brand
  ) => {
    if (cat.iconFamily === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={cat.iconName as any} size={size} color={color} />;
    }
    if (cat.iconFamily === 'Feather') {
      return <Feather name={cat.iconName as any} size={size} color={color} />;
    }
    return <Ionicons name={cat.iconName as any} size={size} color={color} />;
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            Add Transaction
          </Text>

          <View style={{ width: 42 }} />
        </View>

        {/* Compact Form Card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 4,
            backgroundColor: '#FFFFFF',
            borderRadius: 22,
            padding: 16,
            borderWidth: 1,
            borderColor: '#F1F5F9',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Amount Section */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#F3E8FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <FontAwesome5 name="coins" size={18} color={colors.brand} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 6,
                }}
              >
                Amount
              </Text>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setIsAmountFocused(true);
                }}
                style={{
                  height: 50,
                  backgroundColor: isAmountFocused ? '#FAF5FF' : '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: isAmountFocused ? '#8B5CF6' : '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: colors.text,
                    marginRight: 6,
                  }}
                >
                  Rs.
                </Text>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '700',
                    color: colors.brand,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {amount}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Merchant Section */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#F3E8FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={colors.brand} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 6,
                }}
              >
                Merchant
              </Text>
              <View
                style={{
                  height: 48,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  placeholder="e.g. Zomato"
                  placeholderTextColor={colors.textSoft}
                  value={merchantName}
                  onChangeText={setMerchantName}
                  onFocus={() => setIsAmountFocused(false)}
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.text,
                    padding: 0,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Category Section */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#F3E8FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <Ionicons name="pricetag-outline" size={20} color={colors.brand} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 6,
                }}
              >
                Category
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowCategoryModal(true);
                }}
                style={{
                  height: 48,
                  backgroundColor: '#F3E8FF',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {renderCategoryIcon(selectedCategoryObj, 18, colors.brand)}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.text,
                    }}
                  >
                    {selectedCategoryObj.label}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color={colors.brand} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 12 }} />

        {/* Numeric Keypad & Save Container */}
        <View
          style={{
            backgroundColor: '#F3F4F6',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 12, 16),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {numpadKeys.map((val) => (
              <Pressable
                key={val}
                onPress={() => handleNumpadPress(val)}
                style={({ pressed }) => [
                  {
                    width: '31%',
                    height: 48,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                {val === 'backspace' ? (
                  <Ionicons name="backspace-outline" size={22} color={colors.text} />
                ) : (
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '600',
                      color: colors.text,
                    }}
                  >
                    {val}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Save Transaction Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!isAmountValid}
            onPress={handleSave}
            style={{
              width: '100%',
              borderRadius: 24,
              overflow: 'hidden',
              marginTop: 4,
              opacity: isAmountValid ? 1 : 0.45,
              shadowColor: colors.brand,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isAmountValid ? 0.2 : 0,
              shadowRadius: 8,
              elevation: isAmountValid ? 3 : 0,
            }}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 24,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                Save Transaction
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Category Selection Bottom Sheet Modal */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowCategoryModal(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 12,
                paddingHorizontal: 16,
                paddingBottom: Math.max(insets.bottom + 16, 24),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              {/* Drag Indicator */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#CBD5E1',
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />

              {/* Title & Close Button */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 18,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  Select Category
                </Text>

                <TouchableOpacity
                  onPress={() => setShowCategoryModal(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* 4-column Categories Grid */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: 12,
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected =
                    cat.id.toUpperCase() === category.toUpperCase() ||
                    cat.label.toUpperCase() === category.toUpperCase();

                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCategory(cat.id);
                        setShowCategoryModal(false);
                      }}
                      style={{
                        width: '23%',
                        paddingVertical: 14,
                        paddingHorizontal: 4,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#F3E8FF' : '#F8FAFC',
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#8B5CF6' : 'transparent',
                      }}
                    >
                      {renderCategoryIcon(cat, 24, colors.brand)}
                      <Text
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? colors.brand : colors.text,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}
