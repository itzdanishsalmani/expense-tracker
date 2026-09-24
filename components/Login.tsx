import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardType,
  SafeAreaView,
} from 'react-native';

interface RegisterProps {
  name: string;
  email: string;
  password: string;
}

export default function Login() {
  const [userData, setUserData] = useState<RegisterProps>({
    name: '',
    email: '',
    password: '',
  });

  function RegisterUser() {
    // TODO: handle registration
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✦</Text>
          </View>
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
        <TouchableOpacity style={styles.registerButton} onPress={RegisterUser} activeOpacity={0.85}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink}>Sign in</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#1A56F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
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
    backgroundColor: '#1A56F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 22,
    color: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  registerButton: {
    backgroundColor: '#1A56F0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1A56F0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    color: '#1A56F0',
    fontWeight: '700',
  },
});

// ── Input Component ──────────────────────────────────────────

interface InputProps {
  label: string;
  placeholder: string;
  keyboardType: KeyboardType;
  isKeyboardSecured?: boolean;
  field: keyof RegisterProps;
  setUserData: React.Dispatch<React.SetStateAction<RegisterProps>>;
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
        placeholderTextColor="#9CA3AF"
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
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputFocused: {
    borderColor: '#1A56F0',
    backgroundColor: '#fff',
  },
});