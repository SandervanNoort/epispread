<template>
<div class='resizeBoxOuter'>
  <div class='handle-right handle'
    @mousedown.stop.prevent="handleDown('right', $event)" />
  <slot></slot>
</div>
</template>

<script>

export default {
  name: 'resize-box',
  data () {
    return {
      handle: null,
      startX: null,
      startY: null,
      resizing: false
    }
  },
  methods: {
    handleDown (handle, e) {
      this.handle = handle
      if (e.stopPropagation) e.stopPropagation()
      if (e.preventDefault) e.preventDefault()
      this.resizing = true
      this.startX = e.pageX || e.clientX + document.documentElement.scrollLeft
      this.startY = e.pageY || e.clientY + document.documentElement.scrollTop
    },
    handleMove: function (e) {
      if (this.resizing) {
        let mouseX = e.pageX || e.clientX + document.documentElement.scrollLeft
        let mouseY = e.pageY || e.clientY + document.documentElement.scrollTop
        let diffX = mouseX - this.startX
        this.startX = mouseX
        this.startY = mouseY
        this.$emit('resize', {x: diffX, handle: this.handle})
      }
    },
    handleUp (_e) {
      this.resizing = false
      this.$emit('resize', {up: true})
    }
  },
  mounted () {
    document.documentElement.addEventListener('mousemove', this.handleMove, true)
    // document.documentElement.addEventListener('mousedown', this.deselect, true)
    document.documentElement.addEventListener('mouseup', this.handleUp, true)
  }
}
</script>

<style>
.resizeBoxOuter {
  position: absolute;
  background-color: orange;
}
.handle {
  box-sizing: border-box;
  /* display: none; */
  position: absolute;
  width: 50px;
  height: 80%;
  background: green;
}
.handle-right {
  top: 10%;
  height: 80%;
  right: 5px;
  cursor: e-resize;
}

</style>
