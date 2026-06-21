import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Typography } from "./ui/Typography";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Colors, Utility } from "@/src/constants/theme";

interface LocationSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (latitude: number, longitude: number, label?: string) => void;
}

export function LocationSelectionModal({
  visible,
  onClose,
  onSelect,
}: LocationSelectionModalProps): React.JSX.Element {
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLatInput("");
      setLonInput("");
      setLabelInput("");
      setError(null);
    }
  }, [visible]);

  const handleConfirmManual = () => {
    setError(null);
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError("Latitud debe ser un número entre -90 y 90.");
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError("Longitud debe ser un número entre -180 y 180.");
      return;
    }

    onSelect(lat, lon, labelInput.trim() || undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Typography variant="h3">Seleccionar Ubicación</Typography>
              <Pressable onPress={onClose} style={styles.closePressable}>
                <Typography style={styles.closeText}>✕</Typography>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
              <Typography variant="body" style={styles.sectionTitle}>
                Coordenadas Manuales
              </Typography>

              {error && (
                <Typography variant="caption" style={styles.errorText}>
                  {error}
                </Typography>
              )}

              <Input
                label="Nombre/Etiqueta (opcional)"
                placeholder="Ej. Oficina, Mi casa"
                value={labelInput}
                onChangeText={setLabelInput}
              />

              <View style={styles.manualRow}>
                <View style={styles.manualCol}>
                  <Input
                    label="Latitud (-90 a 90)"
                    placeholder="Ej. -34.6037"
                    keyboardType="numeric"
                    value={latInput}
                    onChangeText={setLatInput}
                  />
                </View>
                <View style={styles.manualCol}>
                  <Input
                    label="Longitud (-180 a 180)"
                    placeholder="Ej. -58.3816"
                    keyboardType="numeric"
                    value={lonInput}
                    onChangeText={setLonInput}
                  />
                </View>
              </View>

              <Button
                title="Confirmar Ubicación"
                onPress={handleConfirmManual}
                style={styles.confirmBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoid: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: Utility.spacing.l,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Utility.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  closePressable: {
    padding: Utility.spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "bold",
  },
  scrollBody: {
    padding: Utility.spacing.m,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#475569",
    marginBottom: Utility.spacing.s,
    marginTop: Utility.spacing.xs,
  },
  presetRow: {
    padding: Utility.spacing.m,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    marginBottom: Utility.spacing.s,
  },
  presetRowPressed: {
    backgroundColor: "#F1F5F9",
  },
  presetLabel: {
    fontWeight: "600",
    color: "#1E293B",
  },
  presetCoords: {
    color: "#64748B",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: Utility.spacing.l,
  },
  manualRow: {
    flexDirection: "row",
    gap: Utility.spacing.m,
    marginTop: Utility.spacing.xs,
  },
  manualCol: {
    flex: 1,
  },
  confirmBtn: {
    marginTop: Utility.spacing.m,
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "bold",
    marginBottom: Utility.spacing.s,
  },
});
