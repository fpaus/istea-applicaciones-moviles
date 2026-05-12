import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Colors, Utility } from "@/src/constants/theme";

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Utility.borderRadius.s,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Utility.spacing.m,
    marginBottom: Utility.spacing.m,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
