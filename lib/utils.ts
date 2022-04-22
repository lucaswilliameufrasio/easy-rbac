'use strict'

const debug = require('debug')('rbac')

export async function any(promises: Promise<any>[]) {
  if (promises.length < 1) {
    return Promise.resolve(false)
  }
  return Promise.all(
    promises.map(($p) =>
      $p
        .catch((err) => {
          debug('Underlying promise rejected', err)
          return false
        })
        .then((result) => {
          if (result) {
            throw new Error('authorized')
          }
        }),
    ),
  )
    .then(() => false)
    .catch((err) => err && err.message === 'authorized')
}

export function isGlob(string: string) {
  return string.includes('*')
}

export function globToRegex(string) {
  return new RegExp('^' + string.replace(/\*/g, '.*'))
}

export function parseRoleMap(roles) {
  debug('parsing rolemap')
  // If not a function then should be object
  if (typeof roles !== 'object') {
    throw new TypeError('Expected input to be object')
  }

  let map = new Map()

  // Standardize roles
  Object.keys(roles).forEach((role) => {
    let roleObj: {
      can: Record<string, any>
      canGlob: any[]
      inherits?: any[]
    } = {
      can: {},
      canGlob: [],
    }
    // Check can definition
    if (!Array.isArray(roles[role].can)) {
      throw new TypeError('Expected roles[' + role + '].can to be an array')
    }
    if (roles[role].inherits) {
      if (!Array.isArray(roles[role].inherits)) {
        throw new TypeError(
          'Expected roles[' + role + '].inherits to be an array',
        )
      }
      roleObj.inherits = []
      roles[role].inherits.forEach((child) => {
        if (typeof child !== 'string') {
          throw new TypeError('Expected roles[' + role + '].inherits element')
        }
        if (!roles[child]) {
          throw new TypeError('Undefined inheritance role: ' + child)
        }
        roleObj.inherits.push(child)
      })
    }
    // Iterate allowed operations
    roles[role].can.forEach((operation) => {
      // If operation is string
      if (typeof operation === 'string') {
        // Add as an operation
        if (!isGlob(operation)) {
          roleObj.can[operation] = 1
        } else {
          roleObj.canGlob.push({
            name: globToRegex(operation),
            original: operation,
          })
        }
        return
      }
      // Check if operation has a .when function
      if (
        typeof operation.when === 'function' &&
        typeof operation.name === 'string'
      ) {
        if (!isGlob(operation.name)) {
          roleObj.can[operation.name] = operation.when
        } else {
          roleObj.canGlob.push({
            name: globToRegex(operation.name),
            original: operation.name,
            when: operation.when,
          })
        }
        return
      }
      throw new TypeError('Unexpected operation type' + operation)
    })

    map.set(role, roleObj)
  })

  return map
}
