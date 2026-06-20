import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Project } from "../types";
import { Colors, Utility } from "../constants/theme";
import { Typography } from "./ui/Typography";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

/** Optional inline "create new project" flow rendered inside the picker. */
export interface ProjectPickerCreateFlow {
  isCreating: boolean;
  name: string;
  error: string;
  onChangeName: (text: string) => void;
  onStart: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

interface ProjectPickerModalProps {
  visible: boolean;
  projects: Project[];
  currentId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** When provided, the picker also offers a "+ Nuevo Proyecto" affordance. */
  create?: ProjectPickerCreateFlow;
}

/**
 * Reusable, presentational project picker. Lists projects, highlights the
 * active one, and (optionally) lets the user create a new project inline.
 * All state/handlers arrive via props.
 */
export function ProjectPickerModal({
  visible,
  projects,
  currentId,
  onSelect,
  onClose,
  create,
}: ProjectPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Stop taps inside the sheet from closing the modal. */}
        <TouchableOpacity activeOpacity={1} style={styles.content}>
          <Typography variant="h3" style={styles.title}>
            Proyectos
          </Typography>

          {create?.isCreating ? (
            <View style={styles.createForm}>
              <Input
                placeholder="Nombre del proyecto"
                value={create.name}
                onChangeText={create.onChangeName}
                error={create.error}
                autoFocus
              />
              <View style={styles.formActions}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={create.onCancel}
                  style={styles.formBtn}
                />
                <Button
                  title="Crear"
                  onPress={create.onSubmit}
                  disabled={create.name.trim() === ""}
                  style={styles.formBtn}
                />
              </View>
            </View>
          ) : (
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.itemRow,
                    currentId === item.id && styles.activeItemRow,
                  ]}
                  onPress={() => onSelect(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentId === item.id }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      currentId === item.id && styles.activeItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ListFooterComponent={
                create ? (
                  <TouchableOpacity
                    style={styles.createRow}
                    onPress={create.onStart}
                    accessibilityRole="button"
                    accessibilityLabel="Crear nuevo proyecto"
                  >
                    <Text style={styles.createRowText}>+ Nuevo Proyecto</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Utility.spacing.xl,
  },
  content: {
    width: "100%",
    maxHeight: "60%",
    backgroundColor: Colors.light.background,
    borderRadius: Utility.borderRadius.m,
    padding: Utility.spacing.l,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    marginBottom: Utility.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: Utility.spacing.s,
  },
  itemRow: {
    paddingVertical: 14,
    paddingHorizontal: Utility.spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  activeItemRow: {
    backgroundColor: "#e8e7ff",
    borderRadius: Utility.borderRadius.s,
  },
  itemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  activeItemText: {
    color: Colors.light.primary,
    fontWeight: "bold",
  },
  createRow: {
    alignItems: "center",
    paddingVertical: Utility.spacing.m,
  },
  createRowText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  createForm: {
    gap: Utility.spacing.s,
  },
  formActions: {
    flexDirection: "row",
    gap: Utility.spacing.m,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 10,
  },
});
