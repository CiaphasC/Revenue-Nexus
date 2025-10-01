import type { WorkspaceServerEvent } from "@/lib/workspace/events"

interface EventBus {
  listeners: Set<(event: WorkspaceServerEvent) => void>
}

function getGlobalBus(): EventBus {
  const globalObject = globalThis as typeof globalThis & { __WORKSPACE_EVENT_BUS__?: EventBus }
  if (!globalObject.__WORKSPACE_EVENT_BUS__) {
    globalObject.__WORKSPACE_EVENT_BUS__ = {
      listeners: new Set(),
    }
  }
  return globalObject.__WORKSPACE_EVENT_BUS__
}

export function emitWorkspaceEvent(event: WorkspaceServerEvent) {
  const bus = getGlobalBus()
  for (const listener of bus.listeners) {
    listener(event)
  }
}

export function subscribeWorkspaceEvents(listener: (event: WorkspaceServerEvent) => void) {
  const bus = getGlobalBus()
  bus.listeners.add(listener)
  return () => {
    bus.listeners.delete(listener)
  }
}
