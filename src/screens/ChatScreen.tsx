import React, { useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ChatMessage } from '../types'
import { useShop } from '../context/ShopContext'
import { chatReply } from '../services/aiTasks'
import { colors, gradient } from '../theme'
import { Icon } from '../components/Icon'
import { ErrorBox, SubScreen } from '../components/ui'

const PROMPTS = [
  'Where is cheapest for a braai?',
  'What can I make with R200?',
  'Compare chicken prices across stores',
  'Suggest a weekly meal plan for R500',
]

export function ChatScreen({ onBack }: { onBack: () => void }) {
  const { store, list, budgetNum, total } = useShop()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)
  // Typed structurally so it compiles on every React Native version.
  const scroller = useRef<{ scrollToEnd: (opts?: { animated?: boolean }) => void } | null>(null)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const history: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setInput('')
    setError('')
    setLoading(true)
    try {
      const { reply, remaining: left } = await chatReply(history, { store, list, budget: budgetNum, total })
      setMessages([...history, { role: 'assistant', content: reply }])
      if (left != null) setRemaining(left)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <SubScreen
      title="AI assistant"
      subtitle={remaining != null ? `${remaining} messages left today` : 'Ask about SA groceries'}
      onBack={onBack}
      scroll={false}
      right={<Text style={styles.badge}>AI</Text>}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={(node) => {
            scroller.current = node
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 15, gap: 9 }}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 22 }}>
              <Text style={styles.hint}>Ask me anything about SA groceries</Text>
              {PROMPTS.map((p) => (
                <Pressable key={p} onPress={() => setInput(p)} style={styles.prompt}>
                  <Text style={styles.promptText}>{p}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}>
              {m.role === 'user' ? (
                <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              ) : null}
              <Text style={[styles.bubbleText, m.role === 'user' && { color: '#fff' }]}>{m.content}</Text>
            </View>
          ))}
          {loading ? (
            <View style={[styles.bubble, styles.bot, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={colors.muted} />
              <Text style={{ fontSize: 12, color: colors.muted }}>Thinking</Text>
            </View>
          ) : null}
          {error ? <ErrorBox message={error} /> : null}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about prices, recipes, tips"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} disabled={loading || !input.trim()} style={[styles.send, (loading || !input.trim()) && { backgroundColor: colors.pill }]}>
            <Icon name="send" size={14} color={loading || !input.trim() ? colors.muted : '#fff'} strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  badge: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1.5, borderWidth: 1, borderColor: colors.accent + '44', backgroundColor: colors.accent + '12', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  hint: { color: colors.sub, fontWeight: '600', fontSize: 14, marginBottom: 12 },
  prompt: { alignSelf: 'stretch', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingVertical: 9, paddingHorizontal: 14, marginVertical: 4 },
  promptText: { fontSize: 12, color: colors.sub },
  bubble: { maxWidth: '84%', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 13, overflow: 'hidden' },
  user: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bot: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 13, lineHeight: 21, color: colors.text },
  composer: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.text },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
})
