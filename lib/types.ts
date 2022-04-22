export interface StorageAdapter {
    set: (key: string, value: any) => Promise<void>
    get: (key: string) => Promise<void>
}