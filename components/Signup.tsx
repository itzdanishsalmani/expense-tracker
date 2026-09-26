import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardType,
  Alert
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { RegisterBodyData, RegisterUser } from '@/utils/api';


export default function Signup() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userData, setUserData] = useState<RegisterBodyData>({
    name: '',
    email: '',
    password: '',
  });

  async function Register() {
    const result = await RegisterUser(userData);
    Alert.alert(result.success ? 'Success' : 'Error', result.message);
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerContainer}>
       
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us today. Fill in your details below.</Text>
        </View>

        {/* Inputs */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            keyboardType="default"
            field="name"
            setUserData={setUserData}
          />
          <Input
            label="Email Address"
            placeholder="john@example.com"
            keyboardType="email-address"
            field="email"
            setUserData={setUserData}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            keyboardType="default"
            isKeyboardSecured
            field="password"
            setUserData={setUserData}
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={Register} activeOpacity={0.85}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 28,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: typography.size.xl,
    color: colors.surface,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  registerButton: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  registerButtonText: {
    ...typography.button,
    color: colors.surface,
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.label,
    color: colors.textMuted,
    fontWeight: typography.weight.regular,
  },
  footerLink: {
    ...typography.label,
    color: colors.brand,
    fontWeight: typography.weight.bold,
  },
});

// ── Input Component ──────────────────────────────────────────

interface InputProps {
  label: string;
  placeholder: string;
  keyboardType: KeyboardType;
  isKeyboardSecured?: boolean;
  field: keyof RegisterBodyData;
  setUserData: React.Dispatch<React.SetStateAction<RegisterBodyData>>;
}

export function Input({
  label,
  placeholder,
  keyboardType,
  isKeyboardSecured,
  field,
  setUserData,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, focused && inputStyles.inputFocused]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        keyboardType={keyboardType}
        secureTextEntry={isKeyboardSecured ?? false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(text) => setUserData(prev => ({ ...prev, [field]: text }))}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  inputFocused: {
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
});