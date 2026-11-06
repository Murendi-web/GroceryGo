import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { colors, gradient, serif } from '../theme'
import { isValidEmail, isValidSaPhone } from '../utils/validation'
import { ErrorBox, Field, IconButton, PrimaryButton } from '../components/ui'

type Mode = 'signin' | 'signup'

export function AuthScreen({ onBack }: { onBack: () => void }) {
  const { signIn, signUp, continueAsGuest, demoMode } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const validate = (): string => {
    if (mode === 'signup') {
      if (!firstName.trim()) return 'First name is required.'
      if (!lastName.trim()) return 'Last name is required.'
      if (!isValidEmail(email)) return 'Enter a valid email address.'
      if (!isValidSaPhone(phone)) return 'Enter a valid SA phone number, for example 071 234 5678.'
      if (password.length < 8) return 'Password must be at least 8 characters.'
      if (password !== confirm) return 'Passwords do not match.'
      return ''
    }
    if (!isValidEmail(email)) return 'Enter your email address.'
    if (!password) return 'Enter your password.'
    return ''
  }

  const submit = async () => {
    const problem = validate()
    setError(problem)
    if (problem) return
    setBusy(true)
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp({ firstName, lastName, email, phone, password })
    setBusy(false)
    if (!result.ok) setError(result.message ?? 'Something went wrong. Try again.')
  }

  const guest = async () => {
    setBusy(true)
    const result = await continueAsGuest()
    setBusy(false)
    if (!result.ok) setError(result.message ?? 'Could not start a guest session.')
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.head}>
            <IconButton name="chevronLeft" onPress={onBack} />
            <Text style={styles.brand}>GROCERYGO</Text>
            <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.sub}>{mode === 'signin' ? 'Sign in to continue' : 'Fill in your details below'}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={styles.tabs}>
            {(['signin', 'signup'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m)
                  setError('')
                }}
                style={[styles.tab, mode === m && styles.tabOn]}
              >
                <Text style={[styles.tabText, mode === m && { color: colors.accent }]}>{m === 'signin' ? 'Sign in' : 'Create account'}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'signup' ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Field label="First name" placeholder="First name" value={firstName} onChangeText={setFirstName} containerStyle={{ flex: 1 }} autoCapitalize="words" />
                <Field label="Last name" placeholder="Last name" value={lastName} onChangeText={setLastName} containerStyle={{ flex: 1 }} autoCapitalize="words" />
              </View>
              <Field label="Email address" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <Field label="SA phone number" placeholder="071 234 5678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label="Password" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secureTextEntry />
              <Field label="Confirm password" placeholder="Re-enter your password" value={confirm} onChangeText={setConfirm} secureTextEntry />
            </>
          ) : (
            <>
              <Field label="Email address" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              <Field label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={submit} />
            </>
          )}

          {error ? <ErrorBox message={error} /> : null}
          <PrimaryButton title={mode === 'signin' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} style={{ marginTop: 4 }} />

          <View style={styles.or}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>
          <Pressable onPress={guest} disabled={busy} style={styles.guest}>
            <Text style={styles.guestText}>Continue as guest</Text>
          </Pressable>
          {demoMode ? <Text style={styles.note}>Demo mode: accounts are stored on this device only.</Text> : null}
          <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 26 },
  brand: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 3, marginTop: 14, marginBottom: 5 },
  title: { fontSize: 25, fontWeight: '900', color: '#fff', fontFamily: serif, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  tabs: { flexDirection: 'row', backgroundColor: colors.pill, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  tabOn: { backgroundColor: colors.card, borderColor: colors.border },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  or: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 11, color: colors.muted },
  guest: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  guestText: { color: colors.sub, fontWeight: '600', fontSize: 14 },
  note: { textAlign: 'center', fontSize: 11, color: colors.gold, marginTop: 12 },
  legal: { textAlign: 'center', fontSize: 11, color: colors.muted, lineHeight: 18, marginTop: 12 },
})
