import type { RxJsonSchema } from "rxdb"
import type { Task } from "../tasks/types/task"

export const taskSchema: RxJsonSchema<Task> = {
  title: "tasks",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    title: { type: "string", maxLength: 1000 },
    description: { type: ["string", "null"], default: null, maxLength: 10000 },
    status: { type: "string", maxLength: 20, enum: ["todo", "in_progress", "done"] },
    priority: { type: "string", maxLength: 20, enum: ["low", "medium", "high"] },
    tags: {
      type: "array",
      default: [],
      items: { type: "string", maxLength: 100 },
    },
    assignee: {
      type: ["object", "null"],
      default: null,
      properties: {
        userId: { type: "string", maxLength: 255 },
        username: { type: "string", maxLength: 255 },
        avatar: { type: ["string", "null"], maxLength: 2048 },
      },
      required: ["userId", "username"],
      additionalProperties: false,
    },
    dueDate: { type: ["string", "null"], default: null, maxLength: 50 },
    repository: {
      type: ["object", "null"],
      default: null,
      properties: {
        owner: { type: "string", maxLength: 255 },
        name: { type: "string", maxLength: 255 },
        fullName: { type: "string", maxLength: 512 },
      },
      required: ["owner", "name", "fullName"],
      additionalProperties: false,
    },
    createdBy: {
      type: "object",
      properties: {
        userId: { type: "string", maxLength: 255 },
        username: { type: "string", maxLength: 255 },
        avatar: { type: ["string", "null"], maxLength: 2048 },
      },
      required: ["userId", "username"],
      additionalProperties: false,
    },
    createdAt: { type: "string", maxLength: 100 },
    updatedAt: { type: "string", maxLength: 100 },
  },
  required: ["id", "title", "status", "priority", "tags", "createdBy", "createdAt", "updatedAt"],
  indexes: ["status", "priority", "createdAt"],
}