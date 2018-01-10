<template>
<q-toolbar slot="header" id='header'>
  <q-btn flat @click="layout.toggleLeft()">
    <q-icon name="menu" />
  </q-btn>
  <q-toolbar-title>
    {{ title }}
    <span slot="subtitle">{{ subtitle }}</span>
  </q-toolbar-title>
  <q-btn flat @click="layout.toggleRight()">
    <q-icon name="menu" />
  </q-btn>
</q-toolbar>
</template>

<script>
import { QToolbar, QBtn, QIcon, QToolbarTitle } from 'quasar'
import { addComputed, addWatch } from 'src/storeTools'

export default {
  name: 'header-bar',
  components: { QToolbar, QBtn, QIcon, QToolbarTitle },
  data () {
    return {
      mounted: false
    }
  },
  computed: {
    ...addComputed({
      title: '/global/layout/title',
      subtitle: '/global/layout/subtitle'
    }),
    headerHeight () {
      return this.mounted ? this.$el.clientHeight : 0
    }
  },
  inject: ['layout'],
  mounted () {
    this.mounted = true
  },
  watch: {
    ...addWatch(['headerHeight'])
  },
  destroyed () {
    this.$vset('_status', 'headerHeight', 0)
  }
}
</script>
