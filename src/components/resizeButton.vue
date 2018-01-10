<template>
<button flat
    style='padding: 0px; margin: 0px'
    @mousedown.stop="handleDown($event)"
    @touchstart="handleDown($event)">
  <q-icon name='compare_arrows' />
</button>
</template>

<script>
function getXY (event) {
  let val = {}
  if (event.changedTouches) {
    val.x = event.changedTouches[0].clientX
    val.y = event.changedTouches[0].clientY
  }
  else {
    val.x = event.pageX || event.clientX + document.documentElement.scrollLeft
    val.y = event.pageY || event.clientY + document.documentElement.scrollTop
  }
  return val
}

import { QIcon, QBtn } from 'quasar'
export default {
  name: 'resize-button',
  components: { QIcon, QBtn },
  data () {
    return {
      start: null,
      resizing: false
    }
  },
  methods: {
    handleDown (event) {
      // if (e.stopPropagation) e.stopPropagation()
      // if (e.preventDefault) e.preventDefault()
      this.resizing = true
      this.start = getXY(event)
    },
    handleMove: function (event) {
      if (this.resizing) {
        let position = getXY(event)
        let diff = {
          x: position.x - this.start.x,
          y: position.y - this.start.y,
          handle: this.handle
        }
        this.start = position
        this.$emit('resize', diff)
      }
    },
    handleUp (_event) {
      if (this.resizing) {
        this.$emit('resize', {up: true})
        this.resizing = false
      }
    }
  },
  mounted () {
    document.documentElement.addEventListener('mousemove', this.handleMove, true)
    document.documentElement.addEventListener('touchmove', this.handleMove, true)
    // document.documentElement.addEventListener('mousedown', this.deselect, true)
    document.documentElement.addEventListener('mouseup', this.handleUp, true)
    document.documentElement.addEventListener('touchend', this.handleUp, true)
  }
}
</script>

<style>
</style>
