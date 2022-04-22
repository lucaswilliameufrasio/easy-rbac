import { StorageAdapter } from './types'

export class InMemoryStorage implements StorageAdapter {
  private dataSource = new Map<string, any>()

  async set(key: string, value: any): Promise<void> {
    this.dataSource.set(key, value)
  }

  async get(key: string): Promise<void> {
    const value = this.dataSource.get(key)
    return value
  }
}
