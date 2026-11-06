import React from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { alpha, cardShadow, colors, gradient } from '../theme'
import { Icon, type IconName } from './Icon'

export const card: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
  ...cardShadow,
}

export function Label({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{text}</Text>
}

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  icon?: IconName
  style?: StyleProp<ViewStyle>
}

export function PrimaryButton({ title, onPress, disabled, loading, icon, style }: ButtonProps) {
  const off = disabled || loading
  return (
    <Pressable onPress={onPress} disabled={off} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, style]}>
      <LinearGradient
        colors={off ? [colors.pill, colors.pill] : gradient.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primary}
      >
        {loading ? <ActivityIndicator color={colors.muted} /> : null}
        {!loading && icon ? <Icon name={icon} size={16} color={off ? colors.muted : '#fff'} strokeWidth={2.5} /> : null}
        <Text style={[styles.primaryText, off && { color: colors.muted }]}>{title}</Text>
      </LinearGradient>
    </Pressable>
  )
}

export function OutlineButton({ title, onPress, color = colors.accent, style }: ButtonProps & { color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outline, { borderColor: alpha(color, 0.35), opacity: pressed ? 0.7 : 1 }, style]}
    >
      <Text style={[styles.outlineText, { color }]}>{title}</Text>
    </Pressable>
  )
}

interface FieldProps extends TextInputProps {
  label?: string
  containerStyle?: StyleProp<ViewStyle>
}

export function Field({ label, containerStyle, style, ...rest }: FieldProps) {
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, style]} {...rest} />
    </View>
  )
}

export function IconButton({ name, onPress, size = 33 }: { name: IconName; onPress: () => void; size?: number }) {
  return (
    <Pressable onPress={onPress} style={[styles.iconBtn, { width: size, height: size }]} hitSlop={6}>
      <Icon name={name} size={size * 0.46} color={colors.text} strokeWidth={2} />
    </Pressable>
  )
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={22} color={colors.muted} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

interface SheetProps {
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function Sheet({ visible, onClose, title, subtitle, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <View style={styles.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Icon name="close" size={12} color={colors.muted} strokeWidth={2.5} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 560 }}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

interface SubScreenProps {
  title: string
  subtitle?: string
  onBack: () => void
  scroll?: boolean
  right?: React.ReactNode
  children: React.ReactNode
}

export function SubScreen({ title, subtitle, onBack, scroll = true, right, children }: SubScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.subHead}>
        <IconButton name="chevronLeft" onPress={onBack} />
        <View style={{ flex: 1 }}>
          <Text style={styles.subTitle}>{title}</Text>
          {subtitle ? <Text style={styles.subSub}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 9, fontWeight: '800', color: colors.muted, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 9 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  outline: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  outlineText: { fontWeight: '600', fontSize: 13 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 5 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14, fontWeight: '500' },
  iconBtn: { borderRadius: 9, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 28 },
  emptyIcon: { width: 52, height: 52, borderRadius: 13, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 5 },
  emptyBody: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  errorBox: { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: alpha(colors.red, 0.2), borderRadius: 9, padding: 11, marginBottom: 12 },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 18 },
  backdrop: { flex: 1, backgroundColor: 'rgba(28,22,16,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 36 : 22 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sheetSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  subHead: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  subTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  subSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
})
