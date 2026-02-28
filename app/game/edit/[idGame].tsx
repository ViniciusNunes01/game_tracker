import { loadGamesFromStorage, saveGamesToStorage } from '@/src/services/storageService';
import { getGameById } from '@/src/services/gameService';
import { Game } from '@/src/types/Game';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditGameScreen() {

    const { idGame } = useLocalSearchParams();
    const gameId = Number(idGame);

    const [gameName, setGameName] = useState('');
    const [platform, setPlatform] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [description, setDescription] = useState('');

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadGameData() {
            const existingGame = await getGameById(gameId);
            if (existingGame) {
                setGameName(existingGame.name);
                setReleaseYear(existingGame.releaseYear.toString());
                setDescription(existingGame.personalDescription ?? '');

                if (existingGame.platforms && existingGame.platforms.length > 0) {
                    const firstPlat = existingGame.platforms[0];
                    setPlatform(typeof firstPlat === 'string' ? firstPlat : firstPlat.name);
                }
            }
            setIsLoading(false);
        }
        loadGameData();
    }, [gameId]);

    const handleUpdate = async () => {
        try {
            const allGames = await loadGamesFromStorage();

            const updatedGames = allGames.map(g => {
                if (g.idGame === gameId) {
                    return {
                        ...g,
                        name: gameName,
                        releaseYear: Number(releaseYear) || new Date().getFullYear(),
                        personalDescription: description,
                        platforms: [{ idPlatform: Math.floor(Math.random() * 100), name: platform }],
                    };
                }
                return g;
            });

            await saveGamesToStorage(updatedGames);
            router.back();

        } catch (error) {
            console.error("Erro ao atualizar:", error);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8257E5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: "Editar Jogo", headerBackTitle: "Cancelar" }} />

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Jogo</Text>
                <TextInput
                    style={styles.input}
                    value={gameName}
                    onChangeText={setGameName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Plataforma</Text>
                <TextInput
                    style={styles.input}
                    value={platform}
                    onChangeText={setPlatform}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Ano de Lançamento</Text>
                <TextInput
                    style={styles.input}
                    value={releaseYear}
                    onChangeText={setReleaseYear}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição / Anotações</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                <Text style={styles.buttonText}>Salvar Alterações</Text>
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