import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '@/utils/theme';

export interface ConfirmationBottomSheetProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  icon?: React.ReactNode;
}

export default function ConfirmationBottomSheet({
  visible,
  title = 'Are you sure?',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
  isDanger = true,
  icon,
}: ConfirmationBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom + 16, 24),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 10,
            alignItems: 'center',
          }}
        >
          {/* Drag Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#CBD5E1',
              marginBottom: 20,
            }}
          />

          {/* Icon Badge */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isDanger ? '#FEE2E2' : '#F3E8FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {icon ? (
              icon
            ) : isDanger ? (
              <Feather name="alert-triangle" size={26} color={colors.danger} />
            ) : (
              <Feather name="help-circle" size={26} color={colors.brand} />
            )}
          </View>

          {/* Title */}
          <Text
            style={{
              ...typography.title,
              fontSize: 18,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              ...typography.body,
              fontSize: 14,
              color: colors.textMuted,
              textAlign: 'center',
              marginBottom: 24,
              paddingHorizontal: 12,
            }}
          >
            {message}
          </Text>

          {/* 2 Option Buttons: Yes / No */}
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              gap: 12,
            }}
          >
            {/* No / Cancel */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCancel}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#F1F5F9',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  fontSize: 15,
                  color: colors.text,
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            {/* Yes / Confirm */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 14,
                backgroundColor: isDanger ? colors.danger : colors.brand,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: isDanger ? colors.danger : colors.brand,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  fontSize: 15,
                  color: '#FFFFFF',
                }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

