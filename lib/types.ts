export type StoredRole = {
  can: Record<string, any>
  canGlob: any[]
  inherits?: any[]
}

export interface StorageAdapter {
  set: (key: string, value: StoredRole) => Promise<void>
  get: (key: string) => Promise<StoredRole>
}

export type CanOperation = string | { name: string; when: Promise<boolean> }

export type Roles = Record<
  string,
  {
    can: Array<CanOperation>
    inherits: string[]
  }
>


