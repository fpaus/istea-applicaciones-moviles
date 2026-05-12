import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { Colors } from "@/src/constants/theme";

interface TypographyProps extends TextProps {
  variant?: "h1" | "h2" | "h3" | "body" | "caption";
}

export function Typography({ variant = "body", style, ...props }: TypographyProps) {
  return (
    <Text
      style={[
        styles.base,
        variant === "h1" && styles.h1,
        variant === "h2" && styles.h2,
        variant === "h3" && styles.h3,
        variant === "body" && styles.body,
        variant === "caption" && styles.caption,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.light.text,
  },
  h1: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    color: Colors.light.icon,
  },
});
