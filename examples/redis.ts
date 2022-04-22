// Start Redis with
// docker run --rm -d --name rbac-redis -p 6379:6379 -d redis
// Run with
// DEBUG=rbac npx ts-node examples/redis.ts
import IORedis, { Redis } from 'ioredis'
import { RBAC, StorageAdapter, StoredRole } from '../lib'

class RedisStorageAdapter implements StorageAdapter {
  private redisClient: Redis

  constructor() {
    this.redisClient = new IORedis({
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      username: 'default', // needs Redis >= 6
      password: 'my-top-secret',
      db: 0, // Defaults to 0
    })
  }

  async set(key: string, value: StoredRole): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value))
  }

  async get(key: string): Promise<StoredRole> {
    const valueStringified = await this.redisClient.get(key)

    const value = JSON.parse(valueStringified)

    return value
  }
}

async function main() {
  const redisStorageAdapter = new RedisStorageAdapter()

  const rbac = new RBAC(
    {
      user: {
        can: ['do-something'],
        inherits: [],
      },
    },
    { storageAdapter: redisStorageAdapter },
  )

  for (let index = 0; index < 30; index++) {
    const allowed = await rbac.can('user', 'do-something')
    if (allowed) {
      console.log('Yes, he can!!!')
    } else {
      console.log('Wat!!')
    }
  }

  const allowed = await rbac.can('user', 'delete-the-system')

  console.log('allowed to delete the system?', allowed)

  process.exit(0)
}

main()
