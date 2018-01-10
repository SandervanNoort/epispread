<template>
<component v-if="isChart" :is="artist" :dataset="module" />
</template>

<script>
import { addComputed } from 'src/storeTools'
import epiRect from './rect'
import epiLine from './line'
import epiBar from './bar'
import { nextItem, plugins } from 'src/source/getSource'
import { addFields, addRawData } from 'src/source/data'
import _ from 'lodash'
import getLabel from 'src/tools/getLabel'

export default {
  name: 'dataset',
  props: ['name', 'parent'],
  components: {epiRect, epiLine, epiBar},
  inject: ['layout'],
  computed: {
    ...addComputed({
      labels: 'labels/labels',
      yLabel: 'labels/yLabel',
      pluginName: 'source/name',
      date: 'source/date',
      names: 'source/$names',
      appearance: 'appearance',
      shape: 'appearance/shape',
      color: 'appearance/color',
      label: 'label',
      order: 'order',
      commonLabels: 'this.parent/_status/commonLabels',
      datasetsTaken: 'this.parent/appearance/datasetsTaken',
      datasetColors: 'this.parent/appearance/datasetColors',

      hoverKey: '/_status/hoverKey',
      followMap: 'source/followMap'
    }),
    parentType () {
      return this.$vkey(this.$vmod(this.parent, '..')).slice(0, -1)
    },
    isChart () {
      return this.parentType === 'chart'
    },
    artist () {
      return this.shape
    },
    labelAuto () {
      if (!this.labels || !this.commonLabels) {
        return this.yLabel
      }
      let active = _.differenceBy(
        Object.entries(this.labels),
        this.commonLabels,
        (val) => val.join('_')
      )
      if (active.length === 0) {
        return this.yLabel
      }
      let label = getLabel(active)
      return label
    },
    module () { return `${this.parent}/datasets/${this.name}` }
  },
  created () {
    this.updateSources()
  },
  methods: {
    updateSources () {
      this.$logger.info('updateSources')
      if (this.sourceWatch) {
        this.sourceWatch()
      }
      // this.$vset('source', '$names', [])
      this.names = []
      let plugin = this.addSourceSelect()
      if (plugin !== null && !(plugin instanceof Array)) {
        this.pluginName = plugin.name
        // this.$vpush('source', '$names', 'name')
        this.names.push('name')
        this.parsePlugin(plugin)
      }
      // let watchNames = this.$vget('source', '$names').slice()
      // watchNames.push(this.isChart ? 'location' : 'date')
      let watchNames = this.names.concat(this.isChart ? 'location' : 'date')
      this.sourceWatch = this.$watch(
        () => watchNames.map(key => this.$vget(`source/${key}`)).join('_'),
        () => {
          this.updateSources()
        }
      )
    },
    parsePlugin (plugin) {
      addFields(this, plugin)
      addRawData(this, plugin)
    },
    addSourceSelect () {
      let sourceSelect = {}
      if (this.isChart) {
        sourceSelect._noChart = 'no'
      }
      else {
        sourceSelect._noGeo = 'no'
      }
      let sourceItem = nextItem(sourceSelect)
      while (sourceItem instanceof Array) {
        let [key, options] = sourceItem
        this.$vset('source', '$config_' + key, {
          type: 'text',
          options: options
        })
        if (key !== 'parent') {
          this.$vpush('source', '$names', key)
        }
        let value = this.$vget('source', key)
        if (value !== undefined) {
          sourceSelect[key] = value
        }
        else if (this.pluginName in plugins) {
          let plugin = plugins[this.pluginName]
          let value
          if (key.startsWith('_')) {
            if (key.slice(1) in plugin.select) {
              value = 'yes'
            }
            else {
              value = 'no'
            }
          }
          else {
            if (key in plugin.select) {
              value = plugin.select[key]
            }
            else {
              break
            }
          }
          sourceSelect[key] = value
          this.$vset('source', key, value)
        }
        else {
          break
        }
        sourceItem = nextItem(sourceSelect)
      }
      return sourceItem
    },
    getColor () {
      if (!this.isChart) {
        return
      }
      for (let [index, color] of Object.entries(this.datasetColors)) {
        if (!this.datasetsTaken.includes(index)) {
          this.datasetsTaken.push(index)
          this.colorIndex = index
          return color
        }
      }
      return _.last(this.datasetColors)
    },
    returnColor () {
      if (this.colorIndex !== undefined) {
        this.datasetsTaken = _.without(
          this.datasetsTaken, this.colorIndex)
        this.colorIndex = undefined
      }
    }
  },
  watch: {
    hoverKey (value) {
      if (this.followMap && value) {
        this.$vset('source/location', value).catch((_error) => {
        })
      }
    },
    date (value) {
      this.$logger.debug('date changed', value)
    },
    color: {
      immediate: true,
      handler (value) {
        if (value === 'auto' && this.isChart) { // TODO
          this.color = this.getColor()
        }
      }
    },
    labelAuto: {
      immediate: true,
      handler (value) {
        this.label = value
      }
    }
  },
  beforeDestroy () {
    this.returnColor()
  }
}
</script>
