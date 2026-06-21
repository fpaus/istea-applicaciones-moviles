import { useHeaderHeight } from "@react-navigation/elements";
import React from "react";
import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  StyleSheet,
} from "react-native";

interface KeyboardAvoidingContainerProps extends KeyboardAvoidingViewProps {
  children: React.ReactNode;
}

export function KeyboardAvoidingContainer({
  children,
  style,
  keyboardVerticalOffset,
  ...props
}: KeyboardAvoidingContainerProps): React.JSX.Element {
  const headerHeight = useHeaderHeight();

  // iOS needs the header height so the focused input clears the header.
  // On Android, RN wires keyboardDidHide to the change handler, which recomputes
  // paddingBottom to this offset instead of resetting to 0 — under edge-to-edge a
  // non-zero offset leaves a persistent colored block at the bottom on dismiss.
  // With "padding" behavior the full keyboard height is already applied, so a
  // zero offset lifts the content correctly on show and collapses cleanly on hide.
  const defaultOffset = Platform.OS === "ios" ? headerHeight : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset ?? defaultOffset}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
