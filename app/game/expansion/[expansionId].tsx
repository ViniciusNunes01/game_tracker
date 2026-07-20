import { getGameImagesByIgdbId, getIgdbImageUrl } from '@/src/services/igdbService';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExpansionDetail() {
  const { expansionId } = useLocalSearchParams();
  const expansionIdStr = Array.isArray(expansionId) ? expansionId[0] : expansionId;
  const igdbId = Number(expansionIdStr || '0');

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getGameImagesByIgdbId(igdbId as number);
        setData(res || null);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [igdbId]);

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
  description: { color: '#E1E1E6', fontSize: 15, lineHeight: 22 },
});
