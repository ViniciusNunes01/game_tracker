import { View, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { getGameById } from "../../src/services/gameService";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackScreen } from "react-native-screens";

export default function GameDetail() {

    const { idGame } = useLocalSearchParams();

    const idGameString = Array.isArray(idGame) ? idGame[0] : idGame;
    const gameId = Number(idGameString || "0");

    const game = getGameById(gameId);

    if (!game) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Jogo não encontrado!</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: game.name, headerBackTitle: "Voltar" }} />
            <Text style={styles.title}>{game.name}</Text>
            <Text style={styles.status}>Status: {game.status}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 8,
    },
    status: {
        fontSize: 16,
        color: "#AAA",
    },
    text: {
        color: "#FFF",
    }
});