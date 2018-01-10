<script>
import { addComputed } from 'src/storeTools'

export default {
  computed: {
    ...addComputed({
      yLabel: 'labels/yLabel'
    }),
    showDomain () { return this.xScale.domain() },
    xScale () {
      this.$logger.debug('computed xScale')
      this.scales._bottom // eslint-disable-line
      return this.scales.bottom
    },
    yScale () {
      if (this.rightLabel === this.yLabel) {
        this.scales._right // eslint-disable-line
        return this.scales.right
      }
      this.scales._left // eslint-disable-line
      return this.scales.left
    }
  },
  methods: {
    getX: function (row, scale) {
      scale = scale || this.xScale
      let x = row.xrel !== undefined && row.xrel !== null
        ? (scale.range()[0] +
          row.xrel * (scale.range()[1] - scale.range()[0]))
        : this.xScale(row.xval)
      if (row.dx !== undefined) {
        x += row.dx
      }
      return x
    },
    getY: function (row, scale) {
      scale = scale || this.yScale
      // let scale.y = this.getYScale(ylabel);
      let y = row.yrel !== undefined && row.yrel !== null
        ? (scale.range()[0] +
          row.yrel * (scale.range()[1] - scale.range()[0]))
        : scale(row.yval)
      if (row.dy !== undefined) {
        y += row.dy
      }
      return y
    }
  }
}
</script>
