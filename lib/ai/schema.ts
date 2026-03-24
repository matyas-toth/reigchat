import { z } from "zod";

// Individual tool input schemas for streamText tools
export const createProjectInput = z.object({
  projectName: z
    .string()
    .describe("The name of the new project to create"),
  emoji: z
    .string()
    .optional()
    .describe("A relevant emoji for this project"),
  description: z.string().optional(),
});

export const archiveProjectInput = z.object({
  projectId: z
    .string()
    .describe("The ID of the project to archive (set isActive=false)"),
});

export const addItemInput = z.object({
  projectName: z
    .string()
    .describe(
      "Name of the project this item belongs to — must match an existing project name or one just created"
    ),
  type: z.enum(["TASK", "NOTE", "IDEA"]),
  title: z.string(),
  content: z.string().optional(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "WAITING", "DONE"])
    .default("TODO"),
  dueDate: z
    .string()
    .optional()
    .describe("ISO date string if a deadline is mentioned"),
});

export const updateItemStatusInput = z.object({
  itemId: z
    .string()
    .describe("The ID of the item to update, from the injected state"),
  newStatus: z.enum(["TODO", "IN_PROGRESS", "WAITING", "DONE"]),
});

export const updateItemContentInput = z.object({
  itemId: z.string(),
  newTitle: z.string().optional(),
  newContent: z.string().optional(),
});
