'use strict'

import { InMemoryStorage } from './in-memory-storage'
import { Roles, StorageAdapter } from './types'
import { isPromise } from './utils'

import Debug from 'debug'
import { any, parseAndSaveRoles } from './utils'
const debug = Debug('rbac')

export class RBAC {
  private _ready: boolean
  private _init: Promise<void>
  private storage: StorageAdapter

  constructor(
    roles: Roles | Promise<Roles> | (() => Promise<Roles>),
    options: Partial<{
      storageAdapter: StorageAdapter
    }>,
  ) {
    this.storage = options?.storageAdapter ?? new InMemoryStorage()
    this._ready = false
    debug('initializing')
    this._init = this.init(roles)
  }

  async init(roles: any) {
    if (isPromise(roles)) {
      if (roles.then) {
        roles = await roles
      } else {
        // If opts is a function execute for async loading
        roles = await roles()
      }
    }

    // Add roles to class and mark as ready
    await parseAndSaveRoles(roles, this.storage)
    this._ready = true
  }

  async can(role, operation, params = undefined, cb = undefined) {
    if (typeof cb === 'function') {
      throw new Error('v3 does not support callbacks, you might try v2')
    }
    // If not ready then wait until init finishes
    if (!this._ready) {
      debug('Not ready, wait')
      await this._init
      debug('Init complete, continue')
    }

    if (Array.isArray(role)) {
      debug('array of roles, try all')
      return any(role.map((r) => this.can(r, operation, params)))
    }

    if (typeof role !== 'string') {
      debug('Expected first parameter to be string : role')
      return false
    }

    if (typeof operation !== 'string') {
      debug('Expected second parameter to be string : operation')
      return false
    }

    const $role = await this.storage.get(role)

    if (!$role) {
      debug('Undefined role')
      return false
    }

    // IF this operation is not defined at current level try higher
    if (
      !$role.can[operation] &&
      !$role.canGlob.find((glob) => glob.name.test(operation))
    ) {
      debug('Not allowed at this level, try higher')
      // If no parents reject
      if (!$role.inherits || $role.inherits.length < 1) {
        debug('No inherit, reject false')
        return false
      }
      // Return if any parent resolves true or all reject
      return any(
        $role.inherits.map((parent) => {
          debug('Try from ' + parent)
          return this.can(parent, operation, params)
        }),
      )
    }

    // We have the operation resolve
    if ($role.can[operation] === 1) {
      debug('We have a match, resolve')
      return true
    }

    // Operation is conditional, run async function
    if (typeof $role.can[operation] === 'function') {
      debug('Operation is conditional, run fn')
      try {
        return $role.can[operation](params)
      } catch (e) {
        debug('conditional function threw', e)
        return false
      }
    }

    // Try globs
    let globMatch = $role.canGlob.find((glob) => glob.name.test(operation))
    if (globMatch && !globMatch.when) {
      debug(`We have a globmatch (${globMatch.original}), resolve`)
      return true
    }

    if (globMatch && globMatch.when) {
      debug(`We have a conditional globmatch (${globMatch.original}), run fn`)
      try {
        return globMatch.when(params)
      } catch (e) {
        debug('conditional function threw', e)
        return false
      }
    }

    // No operation reject as false
    debug('Shouldnt have reached here, something wrong, reject')
    throw new Error('something went wrong')
  }

  static create(
    roles: Roles | Promise<Roles> | (() => Promise<Roles>),
    options?: Partial<{
      storageAdapter: StorageAdapter
    }>,
  ) {
    return new RBAC(roles, options)
  }
}
