import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Stage, SubScreen, TabId } from './src/types'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { ShopProvider, useShop } from './src/context/ShopContext'
import { KEYS, loadJson, saveJson } from './src/services/storage'
import { colors } from './src/theme'
import { Icon, type IconName } from './src/components/Icon'
import { Toast } from './src/components/Toast'
import { TopBar } from './src/components/TopBar'
import { SplashScreen } from './src/screens/SplashScreen'
import { OnboardingScreen } from './src/screens/OnboardingScreen'
import { AuthScreen } from './src/screens/AuthScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { MealsScreen } from './src/screens/MealsScreen'
import { ListScreen } from './src/screens/ListScreen'
import { DealsScreen } from './src/screens/DealsScreen'
import { MoreScreen } from './src/screens/MoreScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { LocatorScreen } from './src/screens/LocatorScreen'
import { FavsScreen } from './src/screens/FavsScreen'
import { HistoryScreen } from './src/screens/HistoryScreen'
import { ShareScreen } from './src/screens/ShareScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { AddItemSheet } from './src/screens/AddItemSheet'
import { AdvisorSheet } from './src/screens/AdvisorSheet'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'meals', label: 'Meals', icon: 'meals' },
  { id: 'list', label: 'List', icon: 'list' },
  { id: 'deals', label: 'Deals', icon: 'star' },
  { id: 'more', label: 'More', icon: 'more' },
]

function MainApp() {
  const insets = useSafeAreaInsets()
  const { list } = useShop()
  const [tab, setTab] = useState<TabId>('home')
  const [sub, setSub] = useState<SubScreen | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [advisorOpen, setAdvisorOpen] = useState(false)

  const goTab = (t: TabId) => {
    setSub(null)
    setTab(t)
  }
  const closeSub = () => setSub(null)

  const renderSub = () => {
    switch (sub) {
      case 'chat':
        return <ChatScreen onBack={closeSub} />
      case 'locator':
        return <LocatorScreen onBack={closeSub} />
      case 'favs':
        return <FavsScreen onBack={closeSub} />
      case 'history':
        return <HistoryScreen onBack={closeSub} onRestored={() => goTab('list')} />
      case 'share':
        return <ShareScreen onBack={closeSub} />
      case 'profile':
        return <ProfileScreen onBack={closeSub} />
      default:
        return null
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <TopBar onProfile={() => setSub('profile')} />
          <View style={{ flex: 1 }}>
            {tab === 'home' && <HomeScreen onOpenAdvisor={() => setAdvisorOpen(true)} />}
            {tab === 'meals' && <MealsScreen onGoToList={() => goTab('list')} />}
            {tab === 'list' && <ListScreen onAddItem={() => setAddOpen(true)} onShare={() => setSub('share')} />}
            {tab === 'deals' && <DealsScreen />}
            {tab === 'more' && <MoreScreen onOpenAdvisor={() => setAdvisorOpen(true)} onOpen={setSub} />}
          </View>
        </View>
        {sub ? <View style={StyleSheet.absoluteFill}>{renderSub()}</View> : null}
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((t) => {
          const active = tab === t.id && !sub
          const color = active ? colors.accent : colors.muted
          const label = t.id === 'list' && list.length > 0 ? `List (${list.length})` : t.label
          return (
            <Pressable key={t.id} onPress={() => goTab(t.id)} style={styles.tab}>
              <Icon name={t.icon} size={20} color={color} strokeWidth={t.id === 'more' ? 3 : 1.8} />
              <Text style={[styles.tabLabel, { color }, active && { fontWeight: '700' }]}>{label.toUpperCase()}</Text>
              {active ? <View style={styles.tabDot} /> : null}
            </Pressable>
          )
        })}
      </View>

      <AddItemSheet visible={addOpen} onClose={() => setAddOpen(false)} />
      <AdvisorSheet visible={advisorOpen} onClose={() => setAdvisorOpen(false)} onAdded={() => goTab('list')} />
    </View>
  )
}

function Root() {
  const { user, ready } = useAuth()
  const [stage, setStage] = useState<Stage>('splash')
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!splashDone || !ready) return
    if (user) {
      setStage('main')
      return
    }
    let active = true
    loadJson<boolean>(KEYS.onboarded, false).then((seen) => {
      if (active) setStage(seen ? 'auth' : 'onboard')
    })
    return () => {
      active = false
    }
  }, [splashDone, ready, user])

  const finishOnboarding = () => {
    saveJson(KEYS.onboarded, true)
    setStage('auth')
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={stage === 'main' ? 'dark' : 'light'} />
      {stage === 'splash' && <SplashScreen />}
      {stage === 'onboard' && <OnboardingScreen onDone={finishOnboarding} />}
      {stage === 'auth' && <AuthScreen onBack={() => setStage('onboard')} />}
      {stage === 'main' && user ? <MainApp /> : null}
      <Toast />
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ShopProvider>
          <Root />
        </ShopProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 7 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  tabLabel: { fontSize: 8, fontWeight: '500', letterSpacing: 0.4 },
  tabDot: { position: 'absolute', bottom: -4, width: 14, height: 2.5, borderRadius: 2, backgroundColor: colors.accent },
})