import React from "react";
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { Colors, Utility } from "@/src/constants/theme";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "solid" | "outline" | "danger";
}

export function Button({ title, variant = "solid", style, ...props }: ButtonProps) {
  const isSolid = variant === "solid";
  const isDanger = variant === "danger";
  const isDisabled = props.disabled;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSolid && styles.solid,
        variant === "outline" && styles.outline,
        isDanger && styles.danger,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={isDisabled ? 1 : 0.8}
      {...props}
    >
      <Text
        style={[
          styles.text,
          isSolid && styles.textSolid,
          variant === "outline" && styles.textOutline,
          isDanger && styles.textSolid,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: Utility.spacing.m,
    borderRadius: Utility.borderRadius.s,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: Colors.light.primary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  danger: {
    backgroundColor: "#DC3545",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  textSolid: {
    color: "#FFFFFF",
  },
  textOutline: {
    color: Colors.light.primary,
  },
});
