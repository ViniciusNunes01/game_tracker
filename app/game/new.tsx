import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Game } from '@/src/types/Game';
import { mockGames } from '@/src/services/gameService';

export default function NewGameScreen() {

    const [gameName, setGameName] = useState('');
    const [platform, setPlatform] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');

    const handleSave = () => {

        // TESTES
        const newGame: Game = {
            idGame: Math.floor(Math.random() * 10000),
            name: gameName,
            coverUrl: "https://via.placeholder.com/300x400/202024/7C7C8A?text=Sem+Capa",
            releaseYear: Number(releaseYear) || new Date().getFullYear(),
            personalDescription: description,
            platforms: ['PS5'],
            status: 'backlog',
        };

        // 2. Adicionamos o jogo na nossa lista falsa
        mockGames.push(newGame);


        router.back();
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Adicionar Novo Jogo</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Jogo</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: The Last of Us"
                    placeholderTextColor="#7C7C8A"
                    value={gameName}
                    onChangeText={setGameName}
                />
            </View>

            {/* Implementar Picker/Select no futuro */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Plataforma</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: PS5, Nintendo Switch..."
                    placeholderTextColor="#7C7C8A"
                    value={platform}
                    onChangeText={setPlatform}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Ano de Lançamento</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 2013"
                    placeholderTextColor="#7C7C8A"
                    value={releaseYear}
                    onChangeText={setReleaseYear}
                    keyboardType="numeric"
                    maxLength={4}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição / Anotações</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="O que você achou desse jogo?"
                    placeholderTextColor="#7C7C8A"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Salvar Jogo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 16,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        marginTop: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#E1E1E6',
        marginBottom: 8,
        fontSize: 16,
    },
    input: {
        backgroundColor: '#202024',
        color: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#8257E5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        color: '#7C7C8A',
        fontSize: 16,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
})