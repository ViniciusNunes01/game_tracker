import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [newPlatform, setNewPlatform] = useState('');

  const [statuses, setStatuses] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');

  // Carrega as listas salvas ao abrir a tela
  useEffect(() => {
    async function loadSettings() {
      const savedPlatforms = await AsyncStorage.getItem('custom_platforms');
      const savedStatuses = await AsyncStorage.getItem('custom_statuses');

      if (savedPlatforms) {
        setPlatforms(JSON.parse(savedPlatforms));
      } else {
        // Valores padrão caso seja a primeira vez abrindo o app
        setPlatforms(['PS5', 'PS4', 'Nintendo Switch', 'PC']);
      }

      if (savedStatuses) {
        setStatuses(JSON.parse(savedStatuses));
      } else {
        // Valores padrão
        setStatuses(['Backlog', 'Jogando', 'Terminado', 'Platinado', 'Abandonado']);
      }
    }
    loadSettings();
  }, []);

  // --- FUNÇÕES DE PLATAFORMAS ---
  const handleAddPlatform = async () => {
    if (!newPlatform.trim()) return;
    if (platforms.includes(newPlatform.trim())) {
        Alert.alert("Ops!", "Esta plataforma já existe.");
        return;
    }
    
    const updated = [...platforms, newPlatform.trim()];
    setPlatforms(updated);
    setNewPlatform('');
    await AsyncStorage.setItem('custom_platforms', JSON.stringify(updated));
  };

  const handleRemovePlatform = async (item: string) => {
    const updated = platforms.filter(p => p !== item);
    setPlatforms(updated);
    await AsyncStorage.setItem('custom_platforms', JSON.stringify(updated));
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* --- SEÇÃO DE PLATAFORMAS --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hardware-chip-outline" size={24} color="#8257E5" />
            <Text style={styles.sectionTitle}>Minhas Plataformas</Text>
          </View>
          <Text style={styles.sectionDescription}>Adicione os consoles que você possui para usar no cadastro de jogos.</Text>
          
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Xbox Series X..." 
              placeholderTextColor="#7C7C8A"
              value={newPlatform}
              onChangeText={setNewPlatform}
              onSubmitEditing={handleAddPlatform}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddPlatform}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {platforms.map(plat => (
              <View key={plat} style={styles.tag}>
                <Text style={styles.tagText}>{plat}</Text>
                <TouchableOpacity onPress={() => handleRemovePlatform(plat)}>
                  <Ionicons name="close-circle" size={20} color="#7C7C8A" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

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
  tagText: { color: '#E1E1E6', fontSize: 14, fontWeight: '600' }
});