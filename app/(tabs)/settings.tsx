import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [statuses, setStatuses] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [dashboardColumns, setDashboardColumns] = useState<number>(2);

  // Carrega as listas salvas ao abrir a tela
  useEffect(() => {
    async function loadSettings() {
      const savedStatuses = await AsyncStorage.getItem('custom_statuses');

      if (savedStatuses) {
        setStatuses(JSON.parse(savedStatuses));
      } else {
        // Valores padrão
        setStatuses(['Backlog', 'Jogando', 'Terminado', 'Platinado', 'Abandonado']);
      }

      const savedColumns = await AsyncStorage.getItem('dashboardColumns');
      if (savedColumns) {
        const n = Number(savedColumns);
        const clamped = Math.max(2, Math.min(5, Number.isNaN(n) ? 2 : n));
        setDashboardColumns(clamped);
      }
    }
    loadSettings();
  }, []);

  // --- FUNÇÕES DE PLATAFORMAS ---
  

  // --- FUNÇÕES DE STATUS ---
  const handleAddStatus = async () => {
    if (!newStatus.trim()) return;
    if (statuses.includes(newStatus.trim())) {
        Alert.alert("Ops!", "Este status já existe.");
        return;
    }

    const updated = [...statuses, newStatus.trim()];
    setStatuses(updated);
    setNewStatus('');
    await AsyncStorage.setItem('custom_statuses', JSON.stringify(updated));
  };

  const handleRemoveStatus = async (item: string) => {
    const updated = statuses.filter(s => s !== item);
    setStatuses(updated);
    await AsyncStorage.setItem('custom_statuses', JSON.stringify(updated));
  };

  // --- DASHBOARD COLUMNS ---
  const changeDashboardColumns = async (columns: number) => {
    const clamped = Math.max(2, Math.min(5, columns));
    setDashboardColumns(clamped);
    await AsyncStorage.setItem('dashboardColumns', String(clamped));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Platforms are now pulled from IGDB at game registration; no manual platform list needed. */}

        {/* --- SEÇÃO DE STATUS --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller-outline" size={24} color="#8257E5" />
            <Text style={styles.sectionTitle}>Status de Jogo</Text>
          </View>
          <Text style={styles.sectionDescription}>Gerencie as etiquetas de progresso da sua coleção.</Text>
          
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Em Pausa..." 
              placeholderTextColor="#7C7C8A"
              value={newStatus}
              onChangeText={setNewStatus}
              onSubmitEditing={handleAddStatus}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddStatus}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {statuses.map(status => (
              <View key={status} style={styles.tag}>
                <Text style={styles.tagText}>{status}</Text>
                <TouchableOpacity onPress={() => handleRemoveStatus(status)}>
                  <Ionicons name="close-circle" size={20} color="#7C7C8A" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* --- SEÇÃO FUTURA --- */}
        <View style={[styles.section, { opacity: 0.5 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-download-outline" size={24} color="#8257E5" />
            <Text style={styles.sectionTitle}>Backup e Dados (Em Breve)</Text>
          </View>
          <Text style={styles.sectionDescription}>Exportação do catálogo e configurações de DLCs chegarão em atualizações futuras.</Text>
        </View>

        {/* --- SEÇÃO: DASHBOARD DENSITY --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={24} color="#8257E5" />
            <Text style={styles.sectionTitle}>Dashboard</Text>
          </View>
          <Text style={styles.sectionDescription}>Ajuste quantos títulos aparecem por linha na tela inicial.</Text>

          <View style={styles.columnsRow}>
            {[2, 3, 4, 5].map((c, idx, arr) => (
              <TouchableOpacity
                key={c}
                onPress={() => changeDashboardColumns(c)}
                style={[
                  styles.columnButton,
                  dashboardColumns === c && styles.columnButtonActive,
                  { marginRight: idx === arr.length - 1 ? 0 : 10 }
                ]}
              >
                <Text style={[styles.columnButtonText, dashboardColumns === c && { color: '#FFF' }]}>{c} por linha</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#323238' },
  title: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  section: { backgroundColor: '#202024', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#323238' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  sectionDescription: { color: '#7C7C8A', fontSize: 14, marginBottom: 16, lineHeight: 20 },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#121212', color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#323238', fontSize: 16 },
  addButton: { backgroundColor: '#8257E5', width: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#323238' },
  tagText: { color: '#E1E1E6', fontSize: 14, fontWeight: '600' },
  columnButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#323238', backgroundColor: 'transparent', marginBottom: 8 },
  columnButtonActive: { backgroundColor: '#8257E5', borderColor: '#8257E5' },
  columnButtonText: { color: '#E1E1E6', fontWeight: 'bold' }
  ,
  columnsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }
});