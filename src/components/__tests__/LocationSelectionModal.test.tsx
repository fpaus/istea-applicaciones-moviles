import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { LocationSelectionModal } from "../LocationSelectionModal";

describe("LocationSelectionModal", () => {
  const onSelectMock = jest.fn();
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders manual coordinates section and form inputs when visible", () => {
    const { getByText, getByPlaceholderText } = render(
      <LocationSelectionModal visible={true} onClose={onCloseMock} onSelect={onSelectMock} />
    );

    expect(getByText("Coordenadas Manuales")).toBeTruthy();
    expect(getByPlaceholderText("Ej. Oficina, Mi casa")).toBeTruthy();
    expect(getByPlaceholderText("Ej. -34.6037")).toBeTruthy();
    expect(getByPlaceholderText("Ej. -58.3816")).toBeTruthy();
  });

  it("validates manual coordinates and triggers error text on invalid input", () => {
    const { getByText, getByPlaceholderText } = render(
      <LocationSelectionModal visible={true} onClose={onCloseMock} onSelect={onSelectMock} />
    );

    // Try submitting empty
    fireEvent.press(getByText("Confirmar Ubicación"));
    expect(getByText("Latitud debe ser un número entre -90 y 90.")).toBeTruthy();
    expect(onSelectMock).not.toHaveBeenCalled();

    // Type invalid latitude
    fireEvent.changeText(getByPlaceholderText("Ej. -34.6037"), "120");
    fireEvent.press(getByText("Confirmar Ubicación"));
    expect(getByText("Latitud debe ser un número entre -90 y 90.")).toBeTruthy();

    // Type valid latitude but invalid longitude
    fireEvent.changeText(getByPlaceholderText("Ej. -34.6037"), "-34.5");
    fireEvent.changeText(getByPlaceholderText("Ej. -58.3816"), "200");
    fireEvent.press(getByText("Confirmar Ubicación"));
    expect(getByText("Longitud debe ser un número entre -180 y 180.")).toBeTruthy();

    // Type correct values, but empty label (should assign undefined label)
    fireEvent.changeText(getByPlaceholderText("Ej. -58.3816"), "-58.5");
    fireEvent.press(getByText("Confirmar Ubicación"));

    expect(onSelectMock).toHaveBeenCalledWith(-34.5, -58.5, undefined);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("assigns provided label when specified", () => {
    const { getByText, getByPlaceholderText } = render(
      <LocationSelectionModal visible={true} onClose={onCloseMock} onSelect={onSelectMock} />
    );

    fireEvent.changeText(getByPlaceholderText("Ej. -34.6037"), "-34.521");
    fireEvent.changeText(getByPlaceholderText("Ej. -58.3816"), "-58.532");
    fireEvent.changeText(getByPlaceholderText("Ej. Oficina, Mi casa"), "Oficina Centro");
    fireEvent.press(getByText("Confirmar Ubicación"));

    expect(onSelectMock).toHaveBeenCalledWith(-34.521, -58.532, "Oficina Centro");
    expect(onCloseMock).toHaveBeenCalled();
  });
});
