<template>
  <g class='axis' :transform="axTransform" ref='g'>
    <text v-if="label"
      :x="xpix" :y="ypix" :transform="transform"
      class='label'
      :style="{
        fontSize: fontSize,
        alignmentBaseline: baseline,
        dominantBaseline: baseline
      }"
      @click.stop="leftMenu = module; layout.showLeft()"
      v-text="label" />
  </g>
</template>

<script>
import { zoomIdentity } from 'd3-zoom'
import { axisBottom, axisLeft, axisRight } from 'd3-axis'
import { select } from 'd3-selection'
import { addComputed, autoWatch } from 'src/storeTools'

import xyMixin from './xyMixin'
import getFormat from 'src/tools/getFormat'

export default {
  name: 'epi-axis',
  props: ['name', 'chart'],
  inject: ['layout'],
  mixins: [xyMixin],
  data () {
    return {
      factor: '',
      tickSpace: 40
    }
  },
  computed: {
    ...addComputed({
      leftMenu: '/_status/leftMenu',
      leftLabel: 'this.chart/_status/leftLabel',
      leftFormat: 'this.chart/_status/leftFormat',
      rightFormat: 'this.chart/_status/rightFormat',
      rightLabel: 'this.chart/_status/rightLabel',
      bottomLabel: 'this.chart/_status/xLabel',
      leftMinAuto: 'this.chart/_status/leftMinAuto',
      rightMinAuto: 'this.chart/_status/rightMinAuto',
      scales: 'this.chart/scales',

      border: 'appearance/border',
      label: 'label',
      tickFormat: 'tickFormat',
      minValue: 'minValue',
      fontSize: 'appearance/fontSize',
      margin: 'appearance/margin',
      labelDistance: 'appearance/labelDistance',
      tickSizeOuter: 'appearance/tickSizeOuter',
      tickDistance: 'appearance/tickDistance'
    }),
    module () { return `${this.chart}/axes/${this.name}` },
    baseline () { return this.name === 'bottom' ? 'hanging' : 'baseline' },
    xScale () {
      this.scales._bottom // eslint-disable-line
      return this.scales.bottom
    },
    yScale () {
      let name = this.name === 'right' ? 'right' : 'left'
      this.scales['_' + name] // eslint-disable-line
      return this.scales[name]
    },
    distance () {
      return this.tickSpace + this.labelDistance
    },
    marginAuto () {
      return this.distance +
        (this.label ? this.fontSize : -this.labelDistance) +
        this.border
    },
    ticks () {
      let range = (this.name === 'bottom' ? this.xScale : this.yScale).range()
      return Math.abs(range[1] - range[0]) / this.tickDistance
    },
    scale () {
      // eslint-disable-next-line
      this.scales['_' + this.name]
      return this.scales[this.name]
    },
    xpix () {
      if (this.name === 'bottom') {
        return this.getX({xrel: 0.5})
      }
      else if (this.name === 'left') {
        return -this.distance
      }
      else if (this.name === 'right') {
        return this.distance
        // TODO
      }
    },
    xpix0 () {
      return this.getX({xrel: 0})
    },
    xpix1 () {
      return this.getX({xrel: 1})
    },
    ypix0 () {
      return this.getY({yrel: 0})
    },
    ypix () {
      if (this.name === 'bottom') {
        return this.distance
      }
      else if (this.name === 'left') {
        return this.getY({yrel: 0.5})
      }
      else if (this.name === 'right') {
        return this.getY({yrel: 0.5})
      }
    },
    transform () {
      if (this.name === 'left') {
        return 'rotate(-90,' + this.xpix + ',' + this.ypix + ')'
      }
      else if (this.name === 'right') {
        return 'rotate(90,' + this.xpix + ',' + this.ypix + ')'
      }
      else {
        return ''
      }
    },
    axTransform () {
      if (this.name === 'bottom') {
        return zoomIdentity.translate(0, this.ypix0)
      }
      else if (this.name === 'left') {
        return zoomIdentity.translate(this.xpix0, 0)
      }
      else if (this.name === 'right') {
        return zoomIdentity.translate(this.xpix1, 0)
      }
    },
    tickFormatAuto () {
      if (this.name === 'left') {
        return this.leftFormat
      }
      if (this.name === 'right') {
        return this.rightFormat
      }
      if (this.name === 'bottom') {
        return ''
        // return this.xFormat
      }
    },
    minValueAuto () {
      if (this.name === 'left') {
        return this.leftMinAuto
      }
      if (this.name === 'right') {
        return this.rightMinAuto
      }
    },
    labelBase () {
      if (this.name === 'left') {
        return this.leftLabel
      }
      if (this.name === 'right') {
        return this.rightLabel
      }
      else if (this.name === 'bottom') {
        return this.bottomLabel
      }
    },
    labelAuto () {
      let label = this.labelBase
      let format = this.formats[0]
      if (format) {
        label += ` (${format})`
      }
      return label
    },
    formats () {
      return getFormat(this.tickFormat)
    },
    axFunc () {
      let axFunc
      if (this.name === 'bottom') {
        axFunc = axisBottom
      }
      else if (this.name === 'left') {
        axFunc = axisLeft
      }
      else if (this.name === 'right') {
        axFunc = axisRight
      }
      axFunc = axFunc(this.scale)
      axFunc.tickSizeOuter(this.tickSizeOuter)
      if (typeof this.formats[1] === 'function') {
        axFunc.ticks(this.ticks)
        axFunc.tickFormat(this.formats[1])
      }
      else {
        axFunc.ticks(this.ticks, this.formats[1])
      }
      // axFunc.ticks(this.ticks, this.formats[1])
      return axFunc
    }
  },
  mounted () {
    this.draw()
  },
  methods: {
    draw () {
      for (let elem of this.$el.querySelectorAll('path, g')) {
        this.$el.removeChild(elem)
      }
      if (this.labelBase) {
        this.axFunc(select(this.$el))
      }
      this.$nextTick(() => {
        this.tickSpace = this.getTickSpace()
      })
    },
    getTickSpace () {
      let maxSize = 0
      if (!this.labelBase) {
        return 0
      }
      for (let tick of this.$refs.g.querySelectorAll('g.tick')) {
        let box = tick.getBBox()
        let size = box[this.name === 'bottom' ? 'height' : 'width']
        if (size > maxSize) {
          maxSize = size
        }
      }
      return maxSize
    }
  },
  watch: {
    ...autoWatch(['tickFormat', 'minValue', 'label', 'margin']),
    labelBase: {
      immediate: true,
      handler (value) {
        if (value) {
          this.margin = 60
        }
        else {
          this.margin = 5
        }
      }
    },
    axFunc () {
      this.draw()
    }
  }
}
</script>

<style>
.label {
  fill: black;
  text-anchor: middle;
  margin: 0px;
  padding: 0px;
}

.axis path,
line {
  fill: none;
  stroke: #000;
  stroke-width: 2px;
  shape-rendering: crispEdges;
}

</style>
