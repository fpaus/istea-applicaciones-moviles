import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useHeaderProjectSwitcher } from "../hooks/useHeaderProjectSwitcher";
import { Colors, Utility } from "../constants/theme";
import { ProjectPickerModal } from "./ProjectPickerModal";

/**
 * Presentational header affordance: shows the active project name as a tappable
 * chip and opens the reusable project picker (with inline create) on tap. All
 * state/logic lives in `useHeaderProjectSwitcher`.
 */
export function HeaderProjectSwitcher() {
  const {
    currentProject,
    projectName,
    projects,
    isOpen,
    open,
    close,
    handleSelect,
    isCreating,
    newProjectName,
    error,
    changeName,
    startCreating,
    cancelCreating,
    handleCreate,
  } = useHeaderProjectSwitcher();

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={open}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Proyecto activo: ${projectName}`}
        accessibilityHint="Toca para cambiar de proyecto"
      >
        <Text style={styles.triggerText} numberOfLines={1} ellipsizeMode="tail">
          {projectName}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <ProjectPickerModal
        visible={isOpen}
        projects={projects}
        currentId={currentProject?.id}
        onSelect={handleSelect}
        onClose={close}
        create={{
          isCreating,
          name: newProjectName,
          error,
          onChangeName: changeName,
          onStart: startCreating,
          onCancel: cancelCreating,
          onSubmit: handleCreate,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 240,
    gap: Utility.spacing.xs,
    paddingHorizontal: Utility.spacing.s,
    paddingVertical: 6,
    borderRadius: Utility.borderRadius.s,
    backgroundColor: "#f0f0f3",
  },
  triggerText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
    flexShrink: 1,
  },
  arrow: {
    fontSize: 11,
    color: Colors.light.primary,
  },
});
