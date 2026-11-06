import React from 'react'
import { View } from 'react-native'
import type { CatalogItem, ListItem } from '../types'
import { useShop } from '../context/ShopContext'
import { ItemRow } from '../components/ItemRow'
import { EmptyState, PrimaryButton, SubScreen } from '../components/ui'

export function FavsScreen({ onBack }: { onBack: () => void }) {
  const { catalog, favs, list, inList, toggleItem, showToast } = useShop()

  const items = favs
    .map((name) => catalog.find((c) => c.name === name) ?? list.find((l) => l.name === name))
    .filter((x): x is CatalogItem | ListItem => x != null)

  const addAll = () => {
    for (const item of items) if (!inList(item.name)) toggleItem(item)
    showToast('Saved items added')
  }

  return (
    <SubScreen title="Saved items" subtitle={`${items.length} items`} onBack={onBack}>
      {items.length === 0 ? (
        <EmptyState icon="heart" title="No saved items" body="Tap the heart on any item to save it here." />
      ) : (
        <View>
          <View style={{ gap: 7, marginBottom: 14 }}>
            {items.map((item) => (
              <ItemRow key={item.name} item={item} />
            ))}
          </View>
          <PrimaryButton title="Add all to list" onPress={addAll} />
        </View>
      )}
    </SubScreen>
  )
}
