import React, { useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import { alpha, colors, gradient } from '../theme'
import { initial } from '../utils/format'
import { Icon } from '../components/Icon'
import { Label, SubScreen, card } from '../components/ui'

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { user, signOut, demoMode } = useAuth()
  const { store } = useShop()
  const [notifications, setNotifications] = useState(true)
  const [rating, setRating] = useState(0)

  const rows = [
    { l: 'Email', v: user?.email || 'Not set' },
    { l: 'Phone', v: user?.phone || 'Not set' },
    { l: 'Shopping at', v: store },
  ]

  return (
    <SubScreen title="Profile" onBack={onBack}>
      <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial(user?.name ?? 'G')}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.name ?? 'Guest'}</Text>
          <Text style={styles.email}>{user?.isGuest ? 'Guest session' : user?.email}</Text>
        </View>
      </LinearGradient>

      {demoMode ? (
        <View style={styles.demo}>
          <Text style={styles.demoText}>Demo mode. Add your Supabase keys to .env to sync lists and use the AI features.</Text>
        </View>
      ) : null}

      <Label text="Account" />
      {rows.map((r) => (
        <View key={r.l} style={[card, styles.row]}>
          <Text style={styles.rowLabel}>{r.l}</Text>
          <Text style={styles.rowValue}>{r.v}</Text>
        </View>
      ))}

      <Label text="Notifications" style={{ marginTop: 14 }} />
      <View style={[card, styles.row]}>
        <Text style={styles.rowLabel}>Push notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: colors.green, false: colors.border2 }} />
      </View>

      <Label text="Rate GroceryGo" style={{ marginTop: 14 }} />
      <View style={[card, { padding: 13, marginBottom: 18 }]}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} style={[styles.star, rating >= n && { backgroundColor: alpha(colors.gold, 0.1), borderColor: colors.gold }]}>
              <Icon name="star" size={15} color={rating >= n ? colors.gold : colors.muted} fill={rating >= n ? colors.gold : 'none'} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
        {rating > 0 ? <Text style={styles.thanks}>{rating >= 3 ? 'Thank you for the feedback.' : 'We appreciate the honesty and will improve.'}</Text> : null}
      </View>

      <Pressable onPress={() => signOut()} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 13, padding: 16, marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 19, fontWeight: '800', color: '#fff' },
  name: { fontSize: 16, fontWeight: '800', color: '#fff' },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  demo: { backgroundColor: colors.tipBg, borderWidth: 1, borderColor: alpha(colors.gold, 0.27), borderRadius: 9, padding: 11, marginBottom: 14 },
  demoText: { fontSize: 12, color: colors.tipText, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 13, marginBottom: 7 },
  rowLabel: { fontSize: 13, color: colors.sub },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.text, maxWidth: '60%' },
  star: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  thanks: { fontSize: 12, color: colors.green, marginTop: 8 },
  signOut: { borderWidth: 1, borderColor: alpha(colors.red, 0.33), borderRadius: 11, paddingVertical: 12, alignItems: 'center' },
  signOutText: { color: colors.red, fontWeight: '600', fontSize: 14 },
})
