<template>
  <rect
    :x="xpix"
    :y="ypix"
    :height="height"
    :width="width"
    :style="cStyle" />
</template>

<script>
import xyMixin from './xyMixin'
// import { addWatch } from 'src/storeTools'
import { addComputed } from 'src/storeTools'

export default {
  name: 'epi-rect',
  mixins: [xyMixin],
  props: ['rawDataProp', 'appearanceProp', 'chartProp', 'dataset'],
  computed: {
    ...addComputed({
      scales: 'this.chart/scales',
      rawData: 'rawData',
      appearance: 'appearance'
    }),
    module () { return this.dataset ? this.dataset : '/' },
    chart () {
      if (this.chartProp) {
        return this.chartProp
      }
      return this.$vmod(this.dataset, '../..')
    },
    cStyle () {
      let cStyle = {}
      for (let [key, value] of Object.entries(this.appearance)) {
        if (key === 'color') {
          cStyle.fill = value
        }
        else {
          cStyle[key] = value
        }
      }
      return cStyle
    },
    xpix1 () {
      let x1 = this.rawData.x[0]
      return this.getX({xrel: x1.substr(1)})
    },
    xpix2 () {
      let x2 = this.rawData.x[1]
      return this.getX({xrel: x2.substr(1)})
    },
    ypix1 () {
      let y1 = this.rawData.y[0]
      return this.getY({yrel: y1.substr(1)})
    },
    ypix2 () {
      let y2 = this.rawData.y[1]
      return this.getY({yrel: y2.substr(1)})
    },
    xpix () {
      return Math.min(this.xpix1, this.xpix2)
    },
    ypix () {
      return Math.min(this.ypix1, this.ypix2)
    },
    width () {
      return Math.abs(this.xpix2 - this.xpix1)
    },
    height () {
      return Math.abs(this.ypix1 - this.ypix2)
    }
  }
}
</script>
