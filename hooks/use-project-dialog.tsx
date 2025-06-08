"use client";

import { useState, useCallback } from "react";
import { useProjectStore } from "@/lib/stores/projects";

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "private" | "public";
}

export function useProjectDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const { createProject, updateProject } = useProjectStore();

  const openCreateDialog = useCallback(() => {
    setMode("create");
    setEditingProject(undefined);
    setIsOpen(true);
  }, []);

  const openEditDialog = useCallback((project: Project) => {
    setMode("edit");
    setEditingProject(project);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setEditingProject(undefined);
  }, []);

  const handleSave = useCallback(async (data: {
    name: string;
    description?: string;
    visibility: "private" | "public";
    template?: string;
  }) => {
    if (mode === "create") {
      await createProject(data);
    } else if (editingProject) {
      await updateProject(editingProject.id, data);
    }
  }, [mode, editingProject, createProject, updateProject]);

  return {
    isOpen,
    mode,
    editingProject,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSave,
  };
}