<template>
<div v-if="multi" style='display: flex'>
  <q-btn
      color='primary'
      style='margin: 5px; flex-grow: 1'
      @click="leftMenu = $vmod(leftMenu, keys, varname)">
    {{ label }}
  </q-btn>
  <q-btn v-if="multiOrder > 0"
    small
    color='secondary'
    icon='keyboard_arrow_up'
    style='margin: 5px'
    @click="changeOrder(-1)" />
  <q-btn v-if="multiOrder < multiList.length - 1"
    small
    icon='keyboard_arrow_down'
    color='secondary'
    style='margin: 5px'
    @click="changeOrder(1)" />
</div>
<q-collapsible v-else-if="expand && show"
    :opened="opened"
    :group="'col_' + keys.join('_')"
    class='qcol'
    style='padding-left: 0px'
    :label="label" >
  <var-list :keys="newKeys" />
</q-collapsible>
<q-field v-else-if="show"
    :label="label"
    :labelWidth="labelWidth"
    ref='field'
    :id="id"
    :error="error"
    :helper="helper" >
  <q-toggle v-if="config && config.type === 'bool'"
      v-model="model" />
  <div v-else-if="config && config.type === 'color'"
      style='display: flex' >
    <q-input inverted v-model="model" @focus="focus" @blur="blur" />
    <q-btn :style="{backgroundColor: value}">
      <q-popover>
        <sketch v-model="modelColor" />
      </q-popover>
    </q-btn>
  </div>
  <q-search v-else-if="selectOptions && selectOptions.length > 100"
      v-model="model">
    <q-autocomplete
      :filter="myFilter"
      :static-data="{field: 'value', list: selectOptions}" />
  </q-search>
  <q-select v-else-if="selectOptions"
    :options="selectOptions"
    v-model="model" />
  <q-select v-else-if="options"
    :options="options"
    v-model="model" />
  <!--<q-input v-else inverted :value="getValue(varname)"
    v-on:input="set($event)"></q-input>-->
  <q-input v-else inverted
    v-model="model"
    :after="after"
    @focus="focus"
    @blur="blur" />
</q-field>
</template>

<script>
import { scroll, QField, QInput, QBtn, QIcon, QPopover, QToggle, QCollapsible,
  QItem, QList, QSelect, QSearch, QAutocomplete } from 'quasar'
import { Sketch } from 'vue-color'
import Vue from 'vue'
import tinycolor from 'tinycolor2'
import fuzzysearch from 'fuzzysearch'
import { addComputed } from 'src/storeTools'
import _ from 'lodash'
// import varList from '@/varList'

export default {
  name: 'var-field',
  props: ['varname', 'keys'],
  data () {
    return {
      labelWidth: 5,
      newVal: null,
      error: false,
      helper: ''
    }
  },
  computed: {
    ...addComputed({
      'leftMenu': '/_status/leftMenu',
      'order': 'this.leftMenu/this.keys/this.varname/order',
      'value': 'this.leftMenu/this.keys/this.varname'
    }),
    opened () {
      return this.config && this.config.$opened
    },
    model: {
      get () {
        if (this.newVal !== null) {
          return this.newVal
        }
        let value = this.value
        if (value instanceof Array || value instanceof Object) {
          value = JSON.stringify(value)
        }
        return value
      },
      set (value) {
        this.newVal = value
        this.$vset(this.leftMenu, this.keys, this.varname, value)
          .then(() => {
            this.error = false
            this.helper = ''
          })
          .catch((error) => {
            this.error = true
            this.helper = error.message
          })
      }
    },
    modelColor: {
      get () {
        let tcolor = this.newVal !== null
          ? tinycolor(this.newVal)
          : tinycolor(this.value)
        return {
          a: tcolor.getAlpha(),
          hex: tcolor.toHexString(),
          hsl: tcolor.toHsl(),
          hsv: tcolor.toHsv()
        }
      },
      set (value) {
        let rgba = value.rgba
        this.model = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`
      }
    },
    show () {
      if (this.config && this.config.show) {
        let get = (key) => {
          return this.$vget(this.leftMenu, this.keys, key)
        }
        return this.config.show(get)
      }
      return true
    },
    id () {
      return this.keys.concat(this.varname).join('_')
    },
    defaultValue () {
      if (this.config && 'default' in this.config) {
        let value = this.config.default
        if (typeof value.default === 'function') {
          value = value()
        }
        return value
      }
    },
    after () {
      let after = []
      if (this.defaultValue !== undefined && this.defaultValue !== this.model) {
        after.push({
          icon: 'cached',
          handler: () => {
            this.model = this.defaultValue
          }
        })
      }
      return after
    },
    value () {
      return this.$vget(this.leftMenu, this.keys, this.varname)
    },
    label () {
      let label
      if (this.multi) {
        label = this.$vget(this.leftMenu, this.keys, this.varname, 'label')
      }
      if (!label) {
        label = this.varname.replace(/\b\w/g, l => l.toUpperCase())
      }
      return label
    },
    config () {
      return this.$config(this.leftMenu, this.keys, this.varname)
    },
    parentConfig () {
      return this.$config(this.leftMenu, this.keys)
    },
    expand () {
      return (this.config && !this.config.type)
    },
    multi () {
      return this.parentConfig && ('multiple' in this.parentConfig)
    },
    multiList () {
      if (!this.multi) {
        return
      }
      let objects = this.$vget(this.leftMenu, this.keys)
      let keys = Object.keys(objects)
        .filter((key) => {
          return !(key.startsWith('$') || key.startsWith('_'))
        })
        .sort((key1, key2) => {
          return objects[key1].order > objects[key2].order
        })
      return keys
    },
    multiOrder () {
      return this.multiList.indexOf(this.varname)
    },
    type () {
      return this.config ? this.config.type : 'text'
    },
    newKeys () {
      return this.keys.concat(this.varname)
    },
    options () {
      if (this.config && this.config.options && this.config.options.length < 100) {
        return this.config.options.map(
          (val) => { return {label: String(val), value: val} })
      }
    },
    selectOptions () {
      if (this.config && this.config.selectOptions) {
        return this.config.selectOptions
      }
    },
    searchOptions () {
      if (this.config && this.config.searchOptions) {
        return this.config.searchOptions
      }
    }
  },
  beforeCreate () {
    this.$options.components.varList = require('@/varList.vue').default
  },
  watch: {
    value () {
      this.newVal = null
    },
    leftMenu () {
      this.newVal = null
      this.error = false
    }
  },
  methods: {
    myFilter (terms, { _field, list }) {
      const token = terms.toLowerCase()
      let list1 = list.filter(item => fuzzysearch(token, item['label'].toLowerCase()))
      let list2 = list.filter(item => fuzzysearch(token, item['value'].toLowerCase()))
      return _.union(list1, list2)
    },
    changeOrder (step) {
      let index2 = this.multiOrder + step
      if (index2 < 0 || index2 >= this.multiList.length) {
        this.$logger.error('last/first element')
        return
      }
      let newList = this.multiList.slice()
      newList[this.multiOrder] = newList[index2]
      newList[index2] = this.varname
      for (let [index, key] of newList.entries()) {
        this.$vset(this.leftMenu, this.keys, key, 'order', index)
      }
    },
    focus () {
      if (!this.$q.platform.is.mobile) {
        return
      }
      Vue.nextTick(() => {
        let target = scroll.getScrollTarget(this.$el)
        let targetTop = target.getBoundingClientRect().top
        let fieldTop = this.$refs.field.$el.getBoundingClientRect().top
        let position = scroll.getScrollPosition(target)
        scroll.setScrollPosition(target, position + fieldTop - targetTop)
      })
    },
    blur () {
      // window.location.href = `#`
      return true
    }
  },
  components: {
    QField,
    QInput,
    QBtn,
    QIcon,
    QPopover,
    QToggle,
    QCollapsible,
    QItem,
    QList,
    QSelect,
    Sketch,
    QSearch,
    QAutocomplete
    // varList
  }
}
</script>

<style>
.qcol > .q-item {
  padding: 0px;
}
</style>
