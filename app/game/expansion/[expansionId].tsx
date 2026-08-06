import { getGameImagesByIgdbId, getIgdbImageUrl } from '@/src/services/igdbService';
import { getExpansionOwnership, setExpansionOwnership } from '@/src/services/storageService';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExpansionDetail() {
  const { expansionId } = useLocalSearchParams();
  const expansionIdStr = Array.isArray(expansionId) ? expansionId[0] : expansionId;
  const igdbId = Number(expansionIdStr || '0');

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getGameImagesByIgdbId(igdbId as number);
        setData(res || null);
        const savedOwnership = await getExpansionOwnership(igdbId);
        setOwned(savedOwnership);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [igdbId]);

  const handleSetOwnership = async (value: boolean) => {
    await setExpansionOwnership(igdbId, value);
    setOwned(value);
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#8257E5" />
    </View>
  );

  if (!data) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#E1E1E6' }}>Detalhes não encontrados.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: data.name || 'Expansão' }} />

      {data.cover?.image_id && (
        <Image source={{ uri: getIgdbImageUrl(data.cover.image_id, 't_1080p') || undefined }} style={styles.cover} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{data.name}</Text>

        <View style={[styles.ownershipCard, owned === true && styles.ownershipCardOwned, owned === false && styles.ownershipCardUnowned]}>
          <Text style={styles.ownershipLabel}>Posse</Text>
          <Text style={styles.ownershipValue}>{owned === null ? 'Ainda não informado' : owned ? 'Você possui esta expansão' : 'Você não possui esta expansão'}</Text>
          <View style={styles.ownershipButtons}>
            <TouchableOpacity style={[styles.ownershipButton, owned === true && styles.ownershipButtonActive]} onPress={() => handleSetOwnership(true)}>
              <Text style={styles.ownershipButtonText}>Sim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ownershipButton, owned === false && styles.ownershipButtonActive]} onPress={() => handleSetOwnership(false)}>
              <Text style={styles.ownershipButtonText}>Não</Text>
            </TouchableOpacity>
          </View>
        </View>

        {data.summary ? (
          <Text style={styles.description}>{data.summary}</Text>
        ) : (
          <Text style={[styles.description, { fontStyle: 'italic', color: '#7C7C8A' }]}>Sem descrição disponível.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  cover: { width: '100%', height: 240, backgroundColor: '#000' },
  content: { padding: 20 },
  title: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  ownershipCard: { backgroundColor: '#202024', borderWidth: 1, borderColor: '#323238', borderRadius: 16, padding: 16, marginBottom: 16 },
  ownershipCardOwned: { borderColor: 'rgba(0, 179, 126, 0.45)', backgroundColor: 'rgba(0, 179, 126, 0.10)' },
  ownershipCardUnowned: { borderColor: 'rgba(255, 107, 107, 0.35)', backgroundColor: 'rgba(255, 107, 107, 0.08)' },
  ownershipLabel: { color: '#7C7C8A', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  ownershipValue: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  ownershipButtons: { flexDirection: 'row', gap: 12 },
  ownershipButton: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#323238', backgroundColor: '#17171A', paddingVertical: 12, alignItems: 'center' },
  ownershipButtonActive: { borderColor: '#8257E5', backgroundColor: 'rgba(130, 87, 229, 0.16)' },
  ownershipButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  description: { color: '#E1E1E6', fontSize: 15, lineHeight: 22 },
});
