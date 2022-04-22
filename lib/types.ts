export interface StorageAdapter {
    set: (key: string, value: any) => Promise<void>
    get: (key: string) => Promise<void>
}

export type Roles = {
    can: Array<string | { name: string, when: Promise<boolean> }>
    inherits: string[]
}