"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  FileIcon, 
  Cross2Icon, 
  CheckIcon, 
  ReloadIcon,
  FileTextIcon,
  GlobeIcon,
  LockClosedIcon
} from "@radix-ui/react-icons";
import { 
  Save, 
  FolderPlus, 
  Settings, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const { useState, useEffect, useRef, useCallback } = React;

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  visibility: z.enum(["private", "public"]),
  template: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: {
    id: string;
    name: string;
    description?: string;
    visibility: "private" | "public";
  };
  onSave: (data: ProjectFormData) => Promise<void>;
}

const projectTemplates = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch",
    icon: <FileTextIcon className="h-4 w-4" />,
  },
  {
    id: "react-app",
    name: "React App",
    description: "Modern React application",
    icon: <GlobeIcon className="h-4 w-4" />,
  },
  {
    id: "nextjs-app",
    name: "Next.js App",
    description: "Full-stack Next.js application",
    icon: <Settings className="h-4 w-4" />,
  },
];

export function ProjectDialog({ 
  open, 
  onOpenChange, 
  mode, 
  project, 
  onSave 
}: ProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: "",
      description: "",
      visibility: "private",
      template: "blank",
    },
  });

  const watchedVisibility = watch("visibility");
  const watchedName = watch("name");

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open && project && mode === "edit") {
      reset({
        name: project.name,
        description: project.description || "",
        visibility: project.visibility,
        template: "blank",
      });
    } else if (open && mode === "create") {
      reset({
        name: "",
        description: "",
        visibility: "private",
        template: selectedTemplate,
      });
    }
  }, [open, project, mode, reset, selectedTemplate]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node) && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  const onSubmit = useCallback(async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, onOpenChange]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    setValue("template", templateId);
  }, [setValue]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white/95 text-[#181818] shadow-2xl backdrop-blur-md dark:bg-[#181818]/95 dark:text-[#f2f2f2]"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#181818]/10 px-6 py-4 dark:border-[#ffffff]/10">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                  {mode === "create" ? (
                    <FolderPlus className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {mode === "create" ? "Create Project" : "Edit Project"}
                  </h2>
                  <p className="text-sm text-[#181818]/70 dark:text-[#f2f2f2]/70">
                    {mode === "create" 
                      ? "Start building something amazing" 
                      : "Update your project details"
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#181818]/50 hover:bg-[#181818]/10 hover:text-[#181818] dark:text-[#f2f2f2]/50 dark:hover:bg-[#ffffff]/10 dark:hover:text-[#f2f2f2]"
              >
                <Cross2Icon className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-6">
                {/* Project Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Project Name
                  </label>
                  <input
                    {...register("name")}
                    className="h-10 w-full rounded-lg border border-[#181818]/20 bg-transparent px-3 text-sm placeholder:text-[#181818]/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-[#ffffff]/20 dark:placeholder:text-[#f2f2f2]/50"
                    placeholder="My Awesome Project"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                    <span className="ml-1 text-[#181818]/50 dark:text-[#f2f2f2]/50">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full rounded-lg border border-[#181818]/20 bg-transparent px-3 py-2 text-sm placeholder:text-[#181818]/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-[#ffffff]/20 dark:placeholder:text-[#f2f2f2]/50"
                    placeholder="What's your project about?"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
                  )}
                </div>

                {/* Visibility */}
                <div>
                  <label className="mb-3 block text-sm font-medium">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("visibility", "private")}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        watchedVisibility === "private"
                          ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          : "border-[#181818]/20 hover:border-[#181818]/30 dark:border-[#ffffff]/20 dark:hover:border-[#ffffff]/30"
                      }`}
                    >
                      <LockClosedIcon className="h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">Private</div>
                        <div className="text-xs text-[#181818]/70 dark:text-[#f2f2f2]/70">
                          Only you can access
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("visibility", "public")}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        watchedVisibility === "public"
                          ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                          : "border-[#181818]/20 hover:border-[#181818]/30 dark:border-[#ffffff]/20 dark:hover:border-[#ffffff]/30"
                      }`}
                    >
                      <GlobeIcon className="h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">Public</div>
                        <div className="text-xs text-[#181818]/70 dark:text-[#f2f2f2]/70">
                          Anyone can view
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Template Selection (only for create mode) */}
                {mode === "create" && (
                  <div>
                    <label className="mb-3 block text-sm font-medium">
                      Template
                    </label>
                    <div className="space-y-2">
                      {projectTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template.id)}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                            selectedTemplate === template.id
                              ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              : "border-[#181818]/20 hover:border-[#181818]/30 dark:border-[#ffffff]/20 dark:hover:border-[#ffffff]/30"
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                            {template.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{template.name}</div>
                            <div className="text-xs text-[#181818]/70 dark:text-[#f2f2f2]/70">
                              {template.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 flex items-center justify-between">
                <div className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                  {watchedName.length}/50 characters
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg bg-[#181818]/10 px-4 py-2 text-sm font-medium hover:bg-[#181818]/20 dark:bg-[#ffffff]/10 dark:hover:bg-[#ffffff]/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isValid && !isSubmitting
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-blue-500/50 text-white/70 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <ReloadIcon className="h-4 w-4 animate-spin" />
                        {mode === "create" ? "Creating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {mode === "create" ? "Create Project" : "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}