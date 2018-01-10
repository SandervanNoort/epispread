import Vue from 'vue'
import byKeys from 'src/tools/byKeys'
import _ from 'lodash'
import { max } from 'd3-array'
import { getLogger } from 'src/plugins/logger'
// import Vuex from 'vuex'

let logger = getLogger('store')

let setMutation = function (state, payload) {
  let [allKeys, value] = payload
  let key = _.last(allKeys)
  for (let i = 0; i < allKeys.length - 1; i += 1) {
    let newState = state[allKeys[i]]
    if (newState === undefined) {
      logger.warn('undefined parent key', allKeys.slice(0, i + 1))
      Vue.set(state, allKeys[i], {})
    }
    state = state[allKeys[i]]
  }
  if (!(key in state)) {
    logger.warn('undefined set', allKeys, value)
  }
  Vue.set(state, key, value)
}

let setAction = async function (store, payload) {
  // {keys, key, value }
  let [keys, value] = payload

  let conf = config.apply({$store: store}, keys)

  if (value === undefined || value === null) {
    value = null
    if (conf) {
      if ('default' in conf) {
        value = typeof conf.default === 'function'
          ? conf.default(store.state)
          : conf.default
      }
      else if (conf.type === 'text') {
        value = ''
      }
      else if (conf.type === 'float' || conf.type === 'int') {
        value = 0
      }
      else if (conf.type === 'bool') {
        value = false
      }
    }
    store.commit('set', [keys, value])
    return value
  }

  if (!conf) {
    store.commit('set', [keys, value])
    return value
  }

  if ('allowed' in conf && conf.allowed.includes(value)) {
    store.commit('set', [keys, value])
    return value
  }

  if (conf.type === 'int') {
    value = parseInt(value, 10)
    if (isNaN(value)) {
      throw Error('Not an int')
    }
  }

  if (conf.type === 'float') {
    value = parseFloat(value)
    if (isNaN(value)) {
      throw Error('Not a float')
    }
  }

  if ('min' in conf && value < conf.min) {
    value = conf.min
  }

  if (conf.type === 'array') {
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      }
      catch (e) {
        throw Error('Not a json string')
      }
    }
    if (!(value instanceof Array)) {
      throw Error('Not an array')
    }
  }

  if (conf.options && !conf.options.includes(value)) {
    throw Error(`Cannot set ${keys} to ${value} since it is not in ${conf.options}`)
  }

  store.commit('set', [keys, value])
  return value
}

let defaultAction = async function (store, payload) {
  setAction(store, payload).then((value) => {
    let [keys, _value] = payload
    let conf = config.apply({$store: store}, keys)
    conf = conf ? _.cloneDeep(conf) : {}
    conf.default = value
    keys = keys.slice()
    let key = keys.pop()
    keys.push(`$config_${key}`)
    payload = [keys, conf]
    return setAction(store, payload)
  })
}

let pushMutation = function (state, payload) {
  let [keys, value] = payload
  byKeys(state, keys).push(value)
}

let nextAction = function (store, payload) {
  return new Promise((resolve, reject) => {
    let [keys, step] = payload
    let conf = config.apply({$store: store}, keys)
    let current = byKeys(store.state, keys)
    if (!Number.isInteger(step)) {
      return reject(Error('Not an integer step', step))
    }
    let value
    if (conf && conf.options) {
      let index = conf.options.indexOf(current)
      index = (index + step + conf.options.length) % conf.options.length
      value = conf.options[index]
    }
    else if (conf && conf.type === 'bool') {
      value = !current
    }
    else {
      return reject(Error('Nothing to step through', keys))
    }
    store.commit('set', [keys, value])
  })
}

let pushAction = async function (store, payload) {
  let [keys, value] = payload
  let conf = config.apply({$store: store}, keys)
  let current = byKeys(store.state, keys)

  if (!conf || conf.type === 'array') {
    if (!current) {
      store.commit('set', [keys, [value]])
      return value
    }
    else if (current instanceof Array) {
      store.commit('push', [keys, value])
      return value
    }
    else {
      throw Error('Cannot push to', keys)
    }
  }
  else {
    throw Error('Cannot push to', keys)
  }
}

let deleteMutation = function (state, payload) {
  let allKeys = payload
  let key = _.last(allKeys)
  let parentKeys = allKeys.slice(0, -1)
  Vue.delete(byKeys(state, parentKeys), key)
}

let deleteAction = async function (store, payload) {
  let keys = payload
  let conf = config.apply({$store: store}, keys)
  let current = byKeys(store.state, keys)
  if (current === undefined) {
    throw Error('Cannot delete unavailable', keys)
  }

  if (!conf) {
    store.commit('delete', keys)
    return true
  }

  if (conf.type && !conf.optional) {
    throw Error('Cannot delete when not defined as optional', keys)
  }

  store.commit('delete', keys)
  return true
}

let createMutation = function (state, payload) {
  let [keys, key, value] = payload
  logger.info('create', keys, key, value)
  let target = byKeys(state, keys)
  // Vue.set(target, key, value)
  // let ob = target.__ob__
  Vue.util.defineReactive(target, key, value)
  target._.__ob__.dep.notify()
  // target[key].__ob__.dep.notify()
  // ob.dep.notify()
  // target[key] = value
}

let createAction = async function (store, payload) {
  let [keys, key, value] = payload
  let conf = config.apply({$store: store}, keys)
  let state = byKeys(store.state, keys)
  if ('multiple' in conf) {
    let prefix
    if (key.startsWith('_')) {
      prefix = conf.$prefix || _.last(keys)
      let index = 1
      while (prefix + index in state) {
        index += 1
      }
      key = prefix + index
    }
    let objects = vget.apply({$store: store}, keys)
    let maxOrder = max(Object.values(objects).map((object) => object.order))
    value.order = maxOrder + 1
    store.commit('create', [keys, key, value])
    fill(vget.apply({$store: store}, keys.concat(key)), conf.multiple)
    return keys.concat(key)
  }
  throw Error('Cannot create if not defined as multiple', keys, key, value)
}

let toggleAction = function (store, payload) {
  let keys = payload
  let conf = config.apply({$store: store}, keys)
  let current = byKeys(store.state, keys)
  let value

  if (conf) {
    if (conf.options) {
      let index = conf.options.indexOf(current)
      index = (index + 1) % conf.options.length
      value = conf.options[index]
    }
    else if (typeof current === 'boolean') {
      value = !current
    }
    else {
      return false
    }
  }
  else {
    if (typeof current === 'boolean') {
      value = !current
    }
    else {
      return false
    }
  }
  store.commit('set', keys.concat(value))
  return true
}

let iconsGetter = function (state) {
  return (keys) => {
    let icons = []
    let conf = config({state: state}, keys)
    if ((conf && conf.optional) || !conf) {
      icons.push('remove')
    }
    return icons
  }
}

let addComputed = (valueDict) => {
  let computed = {}
  for (let [key, storeKeys] of Object.entries(valueDict)) {
    computed[key] = {
      get () {
        if (key + 'Prop' in this && this[key + 'Prop']) {
          return this[key + 'Prop']
        }
        return this.$vget(storeKeys)
      },
      set (value) {
        if (key + 'Prop' in this && this[key + 'Prop']) {
          return
        }
        this.$vset(storeKeys, value)
      }
    }
  }
  return computed
}

let addWatch = (values, name) => {
  let watch = {}
  name = name || 'module'
  for (let varname of values) {
    watch[varname] = {
      immediate: true,
      handler (value) {
        this.$vset('/', this[name], '_status', varname, value)
          .catch((error) => {
            logger.error(
              error.message, 'setting',
              this[name], '_status', varname, '=', value
            )
          })
      }
    }
  }
  return watch
}

let autoWatch = (values) => {
  let watch = {}
  for (let varname of values) {
    watch[varname + 'Auto'] = {
      immediate: true,
      handler (value) {
        this[varname] = value
      }
    }
  }
  return watch
}

let vkey = function () {
  let moduleList = flatten.apply(this, arguments)
  return _.last(moduleList)
}

let vset = function () {
  if (arguments.length < 2) {
    logger.error('$vset requires >2 arguments', arguments)
  }
  let keys = Array.prototype.slice.call(arguments)
  let value = keys.pop()
  keys = flatten.apply(this, keys)
  return this.$store.dispatch('set', [keys, value])
}

let vdefault = function () {
  if (arguments.length < 2) {
    logger.error('$vset requires >2 arguments', arguments)
  }
  let keys = Array.prototype.slice.call(arguments)
  let value = keys.pop()
  keys = flatten.apply(this, keys)
  this.$store.dispatch('default', [keys, value])
  return this.$store.dispatch('default', [keys, value])
}

let vcreate = function () {
  if (arguments.length < 3) {
    logger.error('$vcreate requires >3 arguments', arguments)
    return false
  }
  let keys = Array.prototype.slice.call(arguments)
  let value = keys.pop()
  let key = keys.pop()
  keys = flatten.apply(this, keys)
  return this.$store.dispatch('create', [keys, key, value])
}

let vpush = function () {
  if (arguments.length < 2) {
    logger.error('$vset requires >2 arguments', arguments)
  }
  let keys = Array.prototype.slice.call(arguments)
  let value = keys.pop()
  keys = flatten.apply(this, keys)
  return this.$store.dispatch('push', [keys, value])
}

let vnext = function () {
  let keys = Array.prototype.slice.call(arguments)
  let step = keys.pop()
  keys = flatten.apply(this, keys)
  return this.$store.dispatch('next', [keys, step])
}

let getModule = function () {
  let moduleList = flatten.apply(this, arguments)
  return '/' + moduleList.join('/')
}

let flatten = function () {
  let changed = true
  let keys = _.flattenDeep(arguments)
  if (this && 'module' in this &&
    arguments.length > 0 &&
    typeof arguments[0] === 'string' &&
    !(arguments[0].startsWith('/'))
  ) {
    keys.unshift(this.module)
  }

  while (changed) {
    changed = false
    keys = keys.map((key) => {
      if (!(typeof key === 'string')) {
        return key
      }
      let subkeys = key.split('/')
      if (subkeys.length === 1) {
        return key
      }
      changed = true
      if (subkeys[0] === '') {
        subkeys[0] = '/'
      }
      return subkeys
    })
    if (changed) {
      keys = _.flattenDeep(keys)
    }
    changed = false
    keys = keys.map((key) => {
      if (typeof key === 'string' && key.startsWith('this.')) {
        changed = true
        return this[key.substr(5)]
      }
      return key
    })
    if (changed) {
      keys = _.flattenDeep(keys)
    }
  }
  let newKeys = []
  for (let key of keys) {
    if (key === undefined) {
      // ignore
    }
    else if (key === '..') {
      newKeys.splice(-1)
    }
    else if (key === '/' || key === '') {
      newKeys = []
    }
    else {
      newKeys.push(key)
    }
  }
  return newKeys
}

let vget = function () {
  let keys = flatten.apply(this, arguments)
  return byKeys(this.$store.state, keys)
}

let vdelete = function () {
  let keys = flatten.apply(this, arguments)
  return this.$store.dispatch('delete', keys)
}

let config = function () {
  let keys = flatten.apply(this, arguments)
  if (keys.length > 1) {
    // call and not apply since keys is already flattened
    let config = vget.call(this, keys.slice(0, -1), '$config_' + _.last(keys))
    if (config !== undefined) {
      return config
    }
  }
  let config = this.$store.state._CONFIG
  for (let key of keys) {
    if (key in config) {
      config = config[key]
    }
    else if ('multiple' in config && !(key.startsWith('$'))) {
      config = config.multiple
    }
    else {
      return
    }
  }
  return config
}

let fill = function (state, settings, base) {
  for (let [key, value] of Object.entries(settings)) {
    if (key.startsWith('$')) {
      continue
    }
    if (base !== undefined &&
        base.length > 0 &&
        base[0] !== key &&
        base[0] !== 'multiple') {
      continue
    }
    let newBase = base ? base.splice(1) : undefined
    if (!(value instanceof Object)) {
      logger.error('fill ignore', key, value)
    }
    else if ('type' in value || 'default' in value) {
      if (!(key in state)) {
        let val
        if ('default' in value) {
          val = typeof value.default === 'function'
            ? value.default(state)
            : value.default
        }
        else {
          val = null
        }
        Vue.set(state, key, val)
      }
    }
    else if (key === 'multiple') {
      for (let stateKey of Object.keys(state)) {
        fill(state[stateKey], settings[key], newBase)
      }
      Vue.set(state, '_', {active: false})
    }
    else {
      if (!(key in state)) {
        Vue.set(state, key, {})
      }
      fill(state[key], settings[key], newBase)
    }
  }
}

let newStore = function (config) {
  let state = config.state || {}
  let settings = config.settings || {}
  fill(state, settings)
  state._CONFIG = settings
  return {
    state: state,
    actions: {
      set: setAction,
      default: defaultAction,
      toggle: toggleAction,
      create: createAction,
      push: pushAction,
      next: nextAction,
      delete: deleteAction,
      ...(config.actions || {})
    },
    mutations: {
      set: setMutation,
      push: pushMutation,
      delete: deleteMutation,
      create: createMutation,
      ...(config.mutations || {})
    },
    getters: {
      icons: iconsGetter,
      ...(config.getters || {})
    }
  }
}

let addConfig = function (store, keys, settings) {
  if ('multiple' in settings) {
    settings.multiple.order = {
      type: 'int',
      hidden: true
    }
  }
  if (!(config.apply({$store: store}, keys))) {
    Vue.set(
      config.apply({$store: store}, keys.slice(0, -1)),
      _.last(keys),
      settings
    )
    fill(store.state, config.apply({$store: store}), keys)
  }
}

export { addWatch, autoWatch, addComputed, newStore,
  vset, vget, vpush, vcreate, vdefault, vkey, config,
  addConfig, vdelete, vnext, flatten, getModule }
