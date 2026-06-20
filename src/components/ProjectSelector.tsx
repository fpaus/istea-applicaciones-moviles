import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProjectSelector } from "../hooks/useProjectSelector";
import { Colors, Utility } from "../constants/theme";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Typography } from "./ui/Typography";

interface ProjectSelectorProps {
  compact?: boolean;
  onSelect?: (id: string) => void;
}

export function ProjectSelector({
  compact = false,
  onSelect,
}: ProjectSelectorProps) {
  const {
    currentProject,
    projects,
    hasProjects,
    isCreating,
    newProjectName,
    showDropdown,
    error,
    changeName,
    startCreating,
    cancelCreating,
    openDropdown,
    closeDropdown,
    handleCreate,
    handleSelect,
  } = useProjectSelector(onSelect);

  // If there are no projects, prompt creation of the first one
  if (!hasProjects) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Typography variant={compact ? "h3" : "h2"} style={styles.title}>
          {compact ? "Nuevo Proyecto" : "Comienza creando un proyecto"}
        </Typography>
        <Typography variant="caption" style={styles.subtitle}>
          Crea un proyecto para empezar a organizar tus tareas.
        </Typography>
        <Input
          placeholder="Nombre del proyecto"
          value={newProjectName}
          onChangeText={changeName}
          error={error}
          autoFocus={!compact}
        />
        <Button
          title="Crear Proyecto"
          onPress={handleCreate}
          disabled={newProjectName.trim() === ""}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact && (
        <Typography variant="h2" style={styles.title}>
          Selecciona tu proyecto
        </Typography>
      )}

      {/* Dropdown Activator */}
      <TouchableOpacity
        style={[styles.dropdownTrigger, compact && styles.compactTrigger]}
        onPress={openDropdown}
      >
        <View style={styles.triggerContent}>
          <Text style={styles.triggerText}>
            {currentProject ? currentProject.name : "Seleccione un proyecto..."}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* Inline Create Toggle */}
      {!isCreating ? (
        <TouchableOpacity style={styles.toggleCreateBtn} onPress={startCreating}>
          <Text style={styles.toggleCreateText}>+ Nuevo proyecto</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.createForm}>
          <Input
            placeholder="Nombre del proyecto"
            value={newProjectName}
            onChangeText={changeName}
            error={error}
            style={styles.createInput}
          />
          <View style={styles.formActions}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={cancelCreating}
              style={styles.formBtn}
            />
            <Button
              title="Crear"
              onPress={handleCreate}
              disabled={newProjectName.trim() === ""}
              style={styles.formBtn}
            />
          </View>
        </View>
      )}

      {/* Picker Modal Dropdown */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <View style={styles.modalContent}>
            <Typography variant="h3" style={styles.modalTitle}>
              Proyectos
            </Typography>
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.itemRow,
                    currentProject?.id === item.id && styles.activeItemRow,
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <Text
                    style={[
                      styles.itemText,
                      currentProject?.id === item.id && styles.activeItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Utility.spacing.m,
  },
  compactContainer: {
    padding: 0,
  },
  title: {
    textAlign: "center",
    marginBottom: Utility.spacing.s,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Utility.spacing.l,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Utility.borderRadius.s,
    paddingHorizontal: Utility.spacing.m,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    marginBottom: Utility.spacing.m,
  },
  compactTrigger: {
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
  },
  triggerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500",
  },
  arrow: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  toggleCreateBtn: {
    alignItems: "center",
    paddingVertical: Utility.spacing.xs,
  },
  toggleCreateText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  createForm: {
    marginTop: Utility.spacing.s,
    gap: Utility.spacing.s,
  },
  createInput: {
    marginBottom: 0,
  },
  formActions: {
    flexDirection: "row",
    gap: Utility.spacing.m,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Utility.spacing.xl,
  },
  modalContent: {
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
  modalTitle: {
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
});
