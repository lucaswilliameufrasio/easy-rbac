export interface StorageAdapter {
  set: (key: string, value: any) => Promise<void>
  get: (key: string) => Promise<any>
}

export type CanOperation = string | { name: string; when: Promise<boolean> }

export type Roles = {
  can: Array<CanOperation>
  inherits: string[]
}

export type StoredRole = {
  can: Record<string, any>
  canGlob: any[]
  inherits?: any[]
}
