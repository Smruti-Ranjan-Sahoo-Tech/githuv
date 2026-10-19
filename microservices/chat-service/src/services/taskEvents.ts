import type { Server } from "socket.io";

let io: Server | null = null;

export function taskRoom(repoKey: string): string {
    return `tasks:${repoKey}`;
}

export function registerTaskSocket(server: Server): void {
    io = server;
}

/**
 * Broadcasts that a repository's task board changed so every connected user
 * of that repository re-pulls it. No-op when the socket server is unavailable.
 */
export function notifyTasksChanged(repoKey: string): void {
    if (!repoKey || !io) return;
    io.to(taskRoom(repoKey)).emit("tasks-changed", { repoKey });
}
