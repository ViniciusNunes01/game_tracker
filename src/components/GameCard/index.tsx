import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Game } from "../../types/Game";
import { Link } from "expo-router";

interface gameProps {
    data: Game;
};

export function GameCard({ data }: gameProps) {

    return (
        <Link asChild href={`/game/${data.idGame}` as any}>
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                <View style={styles.info}>
                    <Text style={styles.title}>{data.name}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: "#202024",
        overflow: "hidden",
    },
    cover: {
        width: "100%",
        height: 160,
        resizeMode: "cover",
    },
    info: {
        padding: 12,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    status: {
        color: "#00B37E",
        fontSize: 12,
        marginTop: 4,
        textTransform: "uppercase",
    },
});