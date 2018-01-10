<template>
<div>
  <varField v-for="varname in names" :keys="keys"
    :varname="varname"
    :key="varname" />
  <div style='text-align: right'>
    <q-btn v-if="isMulti">
      Delete {{ label }}
      <q-popover ref='popoverDelete'>
        <div class='padded'>
          <p class='caption'>
            Delete {{ label }}?
          </p>
          <q-btn @click="$refs.popoverDelete.close(), deleteMulti()">
            Delete
          </q-btn>
          <q-btn @click="$refs.popoverDelete.close()">
            Keep
          </q-btn>
        </div>
      </q-popover>
    </q-btn>

    <q-btn v-if="hasMulti">
      New {{ label }}
      <q-popover ref='popoverCreate' >
        <div class='padded'>
          <p class='caption'>
            Create new {{ label }}?
          </p>
          <q-btn @click="$refs.popoverCreate.close(), createMulti()">
            Create
          </q-btn>
          <q-btn @click="$refs.popoverCreate.close()">
            Cancel
          </q-btn>
        </div>
      </q-popover>
    </q-btn>

    <q-btn v-else-if="canAdd">
      New {{ label }} property
      <q-popover @open="$refs.addKey.focus()" ref='popover'>
        <div class='padded'>
          <q-field label='Label'>
            <q-input ref='addKey' inverted v-model="addKey" />
          </q-field>
          <q-field label='Value'>
            <q-input inverted v-model="addValue" />
          </q-field>
          <q-btn @click="add">
            Add {{ label }} property
          </q-btn>
        </div>
      </q-popover>
   </q-btn>
 </div>
</div>
</template>

<script>
import { addComputed } from 'src/storeTools'
import varField from './varField'
import { QBtn, QPopover, QField, QInput } from 'quasar'
import _ from 'lodash'

export default {
  name: 'var-list',
  components: { varField, QBtn, QPopover, QField, QInput },
  props: ['keys'],
  data () {
    return {
      addKey: '',
      addValue: ''
    }
  },
  computed: {
    ...addComputed({
      leftMenu: '/_status/leftMenu',
      advanced: '/global/layout/advanced'
    }),
    label () {
      let module = this.$vmod(this.leftMenu, this.keys)
      return this.$vkey(module)
    },
    config () {
      return this.$config(this.leftMenu, this.keys)
    },
    parentConfig () {
      return this.$config(this.leftMenu, this.keys, '..')
    },
    hasMulti () {
      return this.config && 'multiple' in this.config
    },
    isMulti () {
      return this.parentConfig && 'multiple' in this.parentConfig
    },
    canAdd () {
      return this.config && this.config.$add
    },
    names () {
      let configNames = this.$vget(this.leftMenu, this.keys, '$names')
      if (configNames) {
        return configNames
      }
      let state = this.$vget(this.leftMenu, this.keys)
      if (state === undefined) {
        this.leftMenu = this.leftMenu.slice(0, -1)
        return []
      }
      let names = Object.keys(state).map(
        (key) => [key, this.$config(this.leftMenu, this.keys, key)])
      names = names.filter(([key, config]) => {
        if (!this.advanced && (key.startsWith('_') || key.startsWith('$'))) {
          return false
        }
        if (config) {
          if (config.type === 'auto') {
            return false
          }
          if (!this.advanced && config.hidden) {
            return false
          }
        }
        return true
      })
      names.sort(([key1, config1], [key2, config2]) => {
        // return true means that key1 is firs
        if ((config1 === undefined) !== (config2 === undefined)) {
          return config1 === undefined
        }
        if (config1 && config2) {
          if ('$id' in config1 || '$id' in config2) {
            if (!('$id' in config1)) {
              return true
            }
            else if (!('$id' in config1)) {
              return false
            }
            else {
              return config1.$id > config2.$id
            }
          }
          if ('multiple' in config1 !== 'multiple' in config2) {
            return 'multiple' in config1
          }
          if ('type' in config1 !== 'type' in config2) {
            return 'type' in config2
          }
          if ('order' in config1 && 'order' in config2) {
            let order1 = this.$vget(this.leftMenu, this.keys, key1, 'order')
            let order2 = this.$vget(this.leftMenu, this.keys, key2, 'order')
            return order1 > order2
          }
        }
        return key1 > key2
      })
      return names.map(([key, _config]) => key)
    }
  },
  methods: {
    add () {
      if (this.addKey !== '') {
        this.$vset(this.leftMenu, this.keys, this.addKey, this.addValue)
        this.$refs.popover.close()
      }
    },
    createMulti () {
      this.$vcreate(this.leftMenu, this.keys, '_default', {})
        .then((val) => {
          this.leftMenu = val
        })
    },
    deleteMulti () {
      this.$vset(this.leftMenu, 'active', false).then(() => {
        this.$vdelete(this.leftMenu)
      })
    }
  }
}
</script>
