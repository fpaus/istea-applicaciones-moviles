import React from "react";
import { BlurEvent, TextInputProps } from "react-native";
import { Input } from "./Input";

interface NumberInputProps extends Omit<TextInputProps, "onChangeText" | "value"> {
  label?: string;
  error?: string;
  minValue?: number;
  maxValue?: number;
  value: number | null;
  onChangeNumber: (val: number | null) => void;
}

export function NumberInput({
  label,
  error,
  minValue,
  maxValue,
  value,
  onChangeNumber,
  onBlur,
  ...props
}: NumberInputProps): React.JSX.Element {
  const handleChange = (text: string) => {
    // Only allow numeric characters
    let cleaned = text.replace(/[^0-9]/g, "");
    
    if (cleaned === "") {
      onChangeNumber(null);
      return;
    }

    let parsed = parseInt(cleaned, 10);

    // Prevent typing a value greater than maxValue immediately
    if (maxValue !== undefined && parsed > maxValue) {
      parsed = maxValue;
    }

    onChangeNumber(parsed);
  };

  const handleBlur = (e: BlurEvent) => {
    if (value !== null) {
      let parsed = value;
      let clamped = false;

      if (minValue !== undefined && parsed < minValue) {
        parsed = minValue;
        clamped = true;
      }
      if (maxValue !== undefined && parsed > maxValue) {
        parsed = maxValue;
        clamped = true;
      }

      if (clamped) {
        onChangeNumber(parsed);
      }
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <Input
      label={label}
      error={error}
      value={value !== null ? value.toString() : ""}
      onChangeText={handleChange}
      onBlur={handleBlur}
      keyboardType="numeric"
      {...props}
    />
  );
}
