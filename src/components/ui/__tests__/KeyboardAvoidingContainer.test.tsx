import { render } from "@testing-library/react-native";
import React from "react";
import { KeyboardAvoidingView, Platform, Text } from "react-native";
import { KeyboardAvoidingContainer } from "../KeyboardAvoidingContainer";

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: (): number => 64,
}));

function renderWithPlatform(os: "ios" | "android") {
  const original = Platform.OS;
  Platform.OS = os;
  try {
    return render(
      <KeyboardAvoidingContainer>
        <Text>child</Text>
      </KeyboardAvoidingContainer>,
    );
  } finally {
    Platform.OS = original;
  }
}

describe("KeyboardAvoidingContainer", () => {
  it("applies a keyboard-avoiding behavior on Android (edge-to-edge needs it)", () => {
    const { UNSAFE_getByType } = renderWithPlatform("android");
    const kav = UNSAFE_getByType(KeyboardAvoidingView);

    expect(kav.props.behavior).toBeDefined();
  });

  it("applies a keyboard-avoiding behavior on iOS", () => {
    const { UNSAFE_getByType } = renderWithPlatform("ios");
    const kav = UNSAFE_getByType(KeyboardAvoidingView);

    expect(kav.props.behavior).toBeDefined();
  });

  it("offsets the keyboard by the navigation header height on iOS", () => {
    const { UNSAFE_getByType } = renderWithPlatform("ios");
    const kav = UNSAFE_getByType(KeyboardAvoidingView);

    expect(kav.props.keyboardVerticalOffset).toBe(64);
  });

  it("uses no vertical offset on Android to avoid residual padding on dismiss", () => {
    // RN wires Android's keyboardDidHide to _onKeyboardChange, which recomputes
    // paddingBottom to the offset instead of resetting to 0. With edge-to-edge a
    // non-zero offset leaves a persistent colored block at the bottom on dismiss.
    const { UNSAFE_getByType } = renderWithPlatform("android");
    const kav = UNSAFE_getByType(KeyboardAvoidingView);

    expect(kav.props.keyboardVerticalOffset).toBe(0);
  });

  it("honors an explicit keyboardVerticalOffset override on Android", () => {
    const original = Platform.OS;
    Platform.OS = "android";
    try {
      const { UNSAFE_getByType } = render(
        <KeyboardAvoidingContainer keyboardVerticalOffset={20}>
          <Text>child</Text>
        </KeyboardAvoidingContainer>,
      );
      const kav = UNSAFE_getByType(KeyboardAvoidingView);
      expect(kav.props.keyboardVerticalOffset).toBe(20);
    } finally {
      Platform.OS = original;
    }
  });
});
