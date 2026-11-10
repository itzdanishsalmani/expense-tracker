import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '@/utils/theme';
import { useAuth } from '@/context/authContext';
import ConfirmationBottomSheet from '@/components/ConfirmationBottomSheet';
import { updateProfile, profile } from '@/utils/api';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { userData, logout, updateUserData } = useAuth();
  
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit states toggled by pencil icons
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Inline validation errors (no popups)
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (userData?.name) setName(userData.name);
    if (userData?.email) setEmail(userData.email);
  }, [userData]);

  const getInitials = (n?: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.map(part => part[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out SpendSync! A great app for managing your expenses and keeping track of your money seamlessly.',
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleOpenEditProfile = () => {
    setName(userData?.name || '');
    setEmail(userData?.email || '');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsEditingName(false);
    setIsEditingPassword(false);
    setNameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setShowEditProfile(true);
  };

  // Real-time password check
  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    if (val.length > 0 && val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
    if (confirmPassword.length > 0 && val !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (val.length > 0 && newPassword !== val) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSaveProfile = async () => {
    setNameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name cannot be empty');
      setIsEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }

    const payload: profile = {
      name: trimmedName,
    };

    if (isEditingPassword) {
      if (!newPassword) {
        setPasswordError('Please enter a new password');
        setTimeout(() => passwordInputRef.current?.focus(), 100);
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        setTimeout(() => passwordInputRef.current?.focus(), 100);
        return;
      }
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        setTimeout(() => confirmInputRef.current?.focus(), 100);
        return;
      }
      payload.password = newPassword;
    }

    const isNameChanged = trimmedName !== (userData?.name || '').trim();
    const isPasswordEntered = Boolean(payload.password);

    if (!isNameChanged && !isPasswordEntered) {
      setShowEditProfile(false);
      return;
    }

    try {
      setIsSaving(true);
      Keyboard.dismiss();
      const res = await updateProfile(payload);
      if (res.success) {
        await updateUserData({ name: trimmedName });
        setName(trimmedName);
        setNewPassword('');
        setConfirmPassword('');
        setIsEditingName(false);
        setIsEditingPassword(false);
        setShowEditProfile(false);
        Alert.alert('Success', res.message || 'Profile updated successfully!');
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSectionHeader = (title: string) => (
    <Text style={{ ...typography.label, fontSize: 12, color: colors.textMuted, marginLeft: 16, marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>
      {title}
    </Text>
  );

  const renderMenuItem = (
    icon: any, 
    title: string, 
    subtitle?: string, 
    onPress?: () => void, 
    iconColor: string = colors.brand, 
    iconBg: string = '#F3E8FF',
    rightElement?: any,
    isDanger?: boolean
  ) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: isDanger ? '#FFF0F0' : '#FFFFFF',
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.label, color: isDanger ? '#FF3B30' : colors.text, marginBottom: subtitle ? 2 : 0 }}>{title}</Text>
        {subtitle && <Text style={{ ...typography.body, fontSize: 12, color: colors.textMuted }}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : (
        !isDanger && <Feather name="chevron-right" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
  
  const handleEmailRedirect = async () => {
    const to = process.env.EXPO_PUBLIC_EMAIL;
    const subject = 'App Feedback';
    const body = 'Hello Support team,';
    
    // Construct the mailto URL
    const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No email client installed or available.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while opening the email client.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Absolute Gradient Header */}
      <LinearGradient
        colors={['#7C3AED', '#854be9ff', '#FFFFFF']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 250,
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={{ ...typography.title, color: '#FFFFFF', fontSize: 20 }}>Settings</Text>
        <Text style={{ ...typography.body, color: '#E9D8FD', fontSize: 12 }}>Manage your account and preferences</Text>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 100, paddingBottom: 100, paddingHorizontal: 16 }}
      >
        {/* Main Profile Card */}
        <TouchableOpacity 
          onPress={handleOpenEditProfile}
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 16, 
            padding: 16, 
            flexDirection: 'row', 
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
            marginBottom: 16
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#C4B5FD', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Text style={{ ...typography.section, color: '#FFFFFF' }}>{getInitials(userData?.name || name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.label, fontSize: 16, color: colors.text, marginBottom: 2 }}>{userData?.name || name || 'User'}</Text>
            <Text style={{ ...typography.body, fontSize: 13, color: colors.textMuted }}>{userData?.email || email}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* SUPPORT SECTION */}
        {renderSectionHeader('SUPPORT')}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
          {renderMenuItem(
            <Ionicons name="document-text-outline" size={18} color="#8B5CF6" />, 
            'Privacy Policy', 'Learn how we protect your data', 
            async () => await Linking.openURL('https://spendsync-privacy.vercel.app/'),
            '#8B5CF6', '#F3E8FF'
          )}
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          {renderMenuItem(
            <Feather name="message-square" size={18} color="#8B5CF6" />, 
            'Contact Us', 'Get in touch with our support team', handleEmailRedirect, '#8B5CF6', '#F3E8FF'
          )}
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          {renderMenuItem(
            <Ionicons name="share-social-outline" size={18} color="#8B5CF6" />, 
            'Share App', 'Share with your friends and family', handleShare, '#8B5CF6', '#F3E8FF'
          )}
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
          {renderMenuItem(
            <Feather name="star" size={18} color="#F59E0B" />, 
            'Rate App', 'If you like the app, please rate us', async() => await Linking.openURL(process.env.EXPO_PUBLIC_PLAY_STORE_URL || ""), '#F59E0B', '#FEF3C7'
          )}
        </View>

        {renderSectionHeader('OTHER')}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
          {renderMenuItem(
            <Feather name="log-out" size={18} color="#FF3B30" />, 
            'Logout', undefined, () => setShowLogoutModal(true), '#FFFFFF', undefined, true
          )}
        </View>

      </ScrollView>

      {/* Logout Confirmation Bottom Sheet */}
      <ConfirmationBottomSheet
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out of SpendSync?"
        confirmText="Yes"
        cancelText="No"
        isDanger={true}
        icon={<Feather name="log-out" size={26} color={colors.danger} />}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" onRequestClose={() => setShowEditProfile(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <LinearGradient
            colors={['#7C3AED', '#854be9ff', '#FFFFFF']}
            style={{ paddingTop: insets.top + 16, paddingBottom: 60, paddingHorizontal: 16 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Feather name="chevron-left" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={{ ...typography.title, color: '#FFFFFF', fontSize: 20 }}>Edit Profile</Text>
            <Text style={{ ...typography.body, color: '#E9D8FD', fontSize: 12 }}>Update your personal information</Text>
          </LinearGradient>

          {/* KeyboardAvoidingView ensures inputs stay above keyboard */}
          <KeyboardAvoidingView
            style={{ flex: 1, marginTop: -40 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={{ flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20 }}>
              
              <ScrollView 
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 140 }}
              >
                {/* Centered Avatar Initials (Only Name first text at center) */}
                <View style={{ alignItems: 'center', marginBottom: 25 }}>
                  <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#C4B5FD', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.background }}>
                    <Text style={{ ...typography.title, fontSize: 32, color: '#FFFFFF' }}>{getInitials(name)}</Text>
                  </View>
                </View>

                {/* Full Name with Pencil Edit Toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
                  <Text style={{ ...typography.label, fontSize: 13, color: colors.textMuted }}>Full Name</Text>
                  {isEditingName ? (
                    <Text style={{ fontSize: 11, color: colors.brand, fontWeight: '600' }}>Editing...</Text>
                  ) : null}
                </View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isEditingName ? '#FFFFFF' : '#F8FAFC',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  height: 52,
                  marginBottom: nameError ? 6 : 20,
                  borderWidth: 1,
                  borderColor: nameError ? colors.danger : (isEditingName ? colors.brand : '#E2E8F0'),
                }}>
                  <Feather name="user" size={18} color={isEditingName ? colors.brand : colors.textMuted} style={{ marginRight: 12 }} />
                  <TextInput 
                    ref={nameInputRef}
                    value={name}
                    editable={isEditingName}
                    onChangeText={(text) => {
                      setName(text);
                      if (text.trim().length > 0) setNameError('');
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, ...typography.body, fontSize: 15, color: isEditingName ? colors.text : colors.textMuted }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (!isEditingName) {
                        setIsEditingName(true);
                        setTimeout(() => nameInputRef.current?.focus(), 100);
                      } else {
                        setIsEditingName(false);
                      }
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ padding: 4 }}
                  >
                    <Feather 
                      name={isEditingName ? "check" : "edit-2"} 
                      size={16} 
                      color={isEditingName ? colors.brand : colors.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
                {nameError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, marginLeft: 4 }}>
                    <Feather name="alert-circle" size={13} color={colors.danger} />
                    <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '500' }}>{nameError}</Text>
                  </View>
                ) : null}

                {/* Email Address - Locked */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
                  <Text style={{ ...typography.label, fontSize: 13, color: colors.textMuted }}>Email Address</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="lock" size={12} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Locked</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Feather name="mail" size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
                  <TextInput 
                    value={email}
                    editable={false}
                    selectTextOnFocus={false}
                    style={{ flex: 1, ...typography.body, fontSize: 15, color: colors.textMuted }}
                  />
                  <Feather name="lock" size={16} color={colors.textMuted} />
                </View>

                {/* Password Section with Pencil Edit Toggle */}
                {!isEditingPassword ? (
                  <>
                    <Text style={{ ...typography.label, fontSize: 13, color: colors.textMuted, marginBottom: 8, marginLeft: 4 }}>Password</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 28, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Feather name="lock" size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
                      <Text style={{ flex: 1, ...typography.body, fontSize: 15, color: colors.textMuted, letterSpacing: 2 }}>
                        ••••••••••••
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setIsEditingPassword(true);
                          setTimeout(() => {
                            passwordInputRef.current?.focus();
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 150);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                      >
                        <Feather name="edit-2" size={14} color={colors.brand} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {/* New Password */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
                      <Text style={{ ...typography.label, fontSize: 13, color: colors.textMuted }}>New Password</Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setIsEditingPassword(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                          setConfirmPasswordError('');
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      height: 52,
                      marginBottom: passwordError ? 6 : 16,
                      borderWidth: 1,
                      borderColor: passwordError ? colors.danger : colors.border,
                    }}>
                      <Feather name="lock" size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
                      <TextInput 
                        ref={passwordInputRef}
                        placeholder="Enter new password"
                        placeholderTextColor={colors.textMuted}
                        value={newPassword}
                        onChangeText={handlePasswordChange}
                        secureTextEntry={!showNewPassword}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 200);
                        }}
                        style={{ flex: 1, ...typography.body, fontSize: 15, color: colors.text }}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(prev => !prev)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name={showNewPassword ? "eye" : "eye-off"} size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14, marginLeft: 4 }}>
                        <Feather name="alert-circle" size={13} color={colors.danger} />
                        <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '500' }}>{passwordError}</Text>
                      </View>
                    ) : null}

                    {/* Confirm New Password */}
                    <Text style={{ ...typography.label, fontSize: 13, color: colors.textMuted, marginBottom: 8, marginLeft: 4 }}>Confirm New Password</Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      height: 52,
                      marginBottom: confirmPasswordError ? 6 : 28,
                      borderWidth: 1,
                      borderColor: confirmPasswordError ? colors.danger : colors.border,
                    }}>
                      <Feather name="lock" size={18} color={colors.textMuted} style={{ marginRight: 12 }} />
                      <TextInput 
                        ref={confirmInputRef}
                        placeholder="Confirm new password"
                        placeholderTextColor={colors.textMuted}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        secureTextEntry={!showConfirmPassword}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 200);
                        }}
                        style={{ flex: 1, ...typography.body, fontSize: 15, color: colors.text }}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20, marginLeft: 4 }}>
                        <Feather name="alert-circle" size={13} color={colors.danger} />
                        <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '500' }}>{confirmPasswordError}</Text>
                      </View>
                    ) : null}
                  </>
                )}

                {/* Save Changes Button */}
                <TouchableOpacity 
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  activeOpacity={0.8}
                  style={{ 
                    backgroundColor: '#8B5CF6', 
                    borderRadius: 26, 
                    height: 52, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    shadowColor: '#8B5CF6', 
                    shadowOffset: { width: 0, height: 4 }, 
                    shadowOpacity: 0.3, 
                    shadowRadius: 8, 
                    elevation: 5, 
                    marginBottom: 20,
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={{ ...typography.section, fontSize: 16, color: '#FFFFFF' }}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>

            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
