import { StorageAdapter, StoredRole } from './types'

export class InMemoryStorage implements StorageAdapter {
  private dataSource = new Map<string, StoredRole>()

  async set(key: string, value: StoredRole): Promise<void> {
    this.dataSource.set(key, value)
  }

  async get(key: string): Promise<StoredRole> {
    const value = this.dataSource.get(key)
    return value
  }
}
