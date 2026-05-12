import React from "react";
import { StyleSheet, TextInput, TextInputProps, View, Text } from "react-native";
import { Colors, Utility } from "@/src/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.light.icon}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Utility.spacing.m,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: Utility.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Utility.borderRadius.s,
    paddingHorizontal: Utility.spacing.m,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  inputError: {
    borderColor: "#DC3545",
  },
  errorText: {
    fontSize: 12,
    color: "#DC3545",
    marginTop: Utility.spacing.xs,
  },
});
