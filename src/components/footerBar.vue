<template>
<q-toolbar slot="footer" id='footer'>
  <q-toolbar-title>
    Footer
  </q-toolbar-title>
</q-toolbar>
</template>

<script>
import { addWatch } from 'src/storeTools'
import { QToolbar, QToolbarTitle } from 'quasar'

export default {
  name: 'footer-bar',
  data () {
    return {
      mounted: false
    }
  },
  computed: {
    footerHeight () { return this.mounted ? this.$el.clientHeight : 0 }
  },
  components: { QToolbar, QToolbarTitle },
  inject: ['layout'],
  watch: {
    ...addWatch(['footerHeight'])
  },
  mounted () {
    this.mounted = true
  },
  beforeDestroy () {
    this.$vset('_status', 'footerHeight', 0)
  }
}
</script>
