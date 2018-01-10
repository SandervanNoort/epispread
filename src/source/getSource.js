import _ from 'lodash'
import { getLogger } from 'src/plugins/logger'
import { getFnames } from 'src/source/data'

let logger = getLogger('data')

let snippets = {}
let context = require.context('./snippets', false, /\.js/)
for (let fname of context.keys()) {
  let snippet = context(fname)
  let name = fname.split(/[\\/]/).pop().split('.')[0]
  snippets[name] = snippet
}

let plugins = {}

context = require.context('./plugins', false, /\.js/)
for (let fname of context.keys()) {
  let plugin = context(fname)
  if (fname.endsWith('js')) {
    plugin = plugin.default
  }

  if (plugin.snippets) {
    for (let snippet of plugin.snippets) {
      if (!(snippet in snippets)) {
        logger.error('Snippet not found', snippet)
        continue
      }
      _.merge(plugin, snippets[snippet])
    }
  }
  plugins[plugin.name] = plugin
}

for (let plugin of Object.values(plugins)) {
  if (plugin.location) {
    // eslint-disable-next-line
    plugin.locationFunc = new Function(
      'location', 'data',
      plugin.location instanceof Array
        ? plugin.location.join('\n')
        : plugin.location
    )
  }
  for (let [fname, file] of Object.entries(plugin.files)) {
    if (typeof file === 'string') {
      file = {url: file}
    }
    if ('import' in file) {
      let importPlugin = plugins[file.import]
      let importFile = importPlugin.files[getFnames(importPlugin)[0]]
      let url = typeof importFile === 'string' ? importFile : importFile.url
      file = {
        url: url,
        labels: importPlugin.labels
      }
    }

    if (!file.url.startsWith('/')) {
      if (file.url.endsWith('csv')) {
        file.url = '/statics/data/' + file.url
      }
      else if (file.url.endsWith('topojson')) {
        file.url = '/statics/maps/' + file.url
      }
      else {
        logger.error('Unknown file format', file, plugin)
      }
    }
    plugin.files[fname] = file
  }
  plugins[plugin.name] = plugin
}

let fit = function (sourceSelect, test) {
  for (let [key, value] of Object.entries(sourceSelect)) {
    if (key.startsWith('_')) {
      key = key.substr(1)
      if (value === 'yes' && !(key in test)) {
        return false
      }
      if (value === 'no' && (key in test)) {
        return false
      }
    }
    else {
      if (test[key] !== value) {
        return false
      }
    }
  }
  return true
}

let nextItem = function (sourceSelect) {
  let keyDict = {}

  let activePlugins = []
  for (let plugin of Object.values(plugins)) {
    if (!fit(sourceSelect, plugin.select)) {
      continue
    }
    activePlugins.push(plugin)
  }
  if (activePlugins.length === 1) {
    return activePlugins[0]
  }
  else if (activePlugins.length === 0) {
    return null
  }
  for (let plugin of activePlugins) {
    for (let [key, value] of Object.entries(plugin.select)) {
      if (!(key in sourceSelect)) {
        if (key in keyDict) {
          keyDict[key].options.add(value)
          keyDict[key].count += 1
        }
        else {
          keyDict[key] = {
            options: new Set([value]),
            count: 1
          }
        }
      }
    }
  }
  // let possibleKeys = Object.entries(keyDict)
  let possibleKeys = Object.entries(keyDict).filter(
    ([_key, dict]) => dict.options.size > 1)
  let nextKey = _.maxBy(
    possibleKeys,
    ([_key, keyDict]) => keyDict.count
  )
  if (nextKey[1].count === activePlugins.length) {
    return [nextKey[0], [...nextKey[1].options]]
  }
  else {
    return ['_' + nextKey[0], ['yes', 'no']]
  }
}

export { nextItem, plugins }
