<template>
<g>
  <rect v-for="y in yRange"
    :x="x"
    :y="y"
    :width="width"
    height='1'
    :style="{fill: colorScale(legendScale(y))}"
    @click.stop="leftMenu = module; layout.showLeft()" />
  <rect v-for="(tick, index) in yticks"
    :x="x + (left > 0 ? width - tickWidth * width  : - tickWidth * width)"
    :y="legendScale.invert(tick)
      + ((index === yticks.length - 1) ? - tickHeight : 0)"
    :height="tickHeight"
    :width="tickWidth * width"
    style='fill: black' />
  <text v-for="tick, index of yticks"
      :x="x + (left > 0
        ? width + tickWidth * width + tickGap
        : - tickWidth * width - tickGap)"
      :y="legendScale.invert(tick)"
      :style="{
        fontSize: fontSize + 'px',
        alignmentBaseline: 'central',
        dominantBaseline: 'central',
        textAnchor: left > 0 ? 'start' : 'end'
      }">
    {{ getValue(tick) }}
  </text>
  <text
      :x="x + (left > 0 ? 0 : width)"
      :y="yTitle"
      @click.stop="leftMenu = geo; layout.showLeft()"
      :style="{
        fontSize: titleSize + 'px',
        alignmentBaseline: 'baseline',
        dominantBaseline: 'baseline',
        textAnchor: left > 0 ? 'start' : 'end'
      }" >
    {{ label }}
  </text>
</g>
</template>

<script>
import { addComputed, addWatch } from 'src/storeTools'
import _ from 'lodash'
import * as chromatic from 'd3-scale-chromatic'
import { scaleLog, scaleLinear } from 'd3-scale'
import numberFormat from 'src/tools/numberFormat'
import getFormat from 'src/tools/getFormat'

export default {
  name: 'geo-legend',
  props: ['geo'],
  inject: ['layout'],
  computed: {
    ...addComputed({
      leftMenu: '/_status/leftMenu',

      log: 'log',
      minValue: 'minValue',
      maxValue: 'maxValue',
      color: 'color',

      height: 'size/height',
      width: 'size/width',
      left: 'size/left',
      top: 'size/top',
      titleSize: 'size/titleSize',
      titleGap: 'size/titleGap',

      ticks: 'ticks/ticks',
      fontSize: 'ticks/fontSize',
      tickHeight: 'ticks/tickHeight',
      tickWidth: 'ticks/tickWidth',
      tickGap: 'ticks/tickGap',

      label: 'this.geo/label',
      geoHeight: 'this.geo/_status/height',
      geoWidth: 'this.geo/_status/width',
      datasetList: 'this.geo/_status/datasetList'
    }),
    module () { return `${this.geo}/legend` },
    yRange () {
      let [min, max] = this.legendScale.domain()
      return _.range(min, max)
    },
    yFormat () {
      for (let datasetKey of this.datasetList) {
        return this.$vget('this.geo', `datasets/${datasetKey}/labels/yFormat`)
      }
    },
    yLabel () {
      for (let datasetKey of this.datasetList) {
        return this.$vget('this.geo', `datasets/${datasetKey}/labels/yLabel`)
      }
    },
    labelAuto () {
      let [factor, _func] = getFormat(this.yFormat)
      return `${this.yLabel} ${factor}`
    },
    yticks () {
      let yticks = _.range(0, 1, 1 / (this.ticks - 1))
      yticks.push(1)
      return yticks
    },
    yRangeText () {
      let [min, max] = this.legendScale.domain()
      return _.range(min, max + 1, (max - min) / (this.ticks - 1))
    },
    x () {
      return this.left > 0
        ? this.left
        : this.geoWidth + this.left - this.width
    },
    yTitle () {
      return this.top + this.titleSize
    },
    yLegend () {
      return this.top + this.titleSize + this.titleGap + 0.5 * this.fontSize
    },
    valueScale () {
      // incidence => [0, 1]
      let minValue = (this.log && this.minValue === 0) ? this.maxValue / 1000 : this.minValue
      return (this.log ? scaleLog() : scaleLinear())
        .domain([minValue, this.maxValue])
    },
    colorScale () {
      // [0, 1] => color
      return chromatic['interpolate' + this.color] // eslint-disable-line
    },
    legendScale () {
      // [legend pix] => [0, 1]
      return scaleLinear().domain([this.yLegend, this.yLegend + this.height])
    },
    scale () {
      return (value) => {
        return this.colorScale(this.valueScale(value))
      }
    }
  },
  methods: {
    getValue (tick) {
      let value = this.valueScale.invert(tick)
      let [_factor, func] = getFormat(this.yFormat)
      if (typeof func === 'function') {
        value = func(value)
      }
      return numberFormat(value)
    }
  },
  watch: {
    ...addWatch(['scale'])
    /*
    labelAuto: {
      immediate: true,
      handler (label) {
        this.label = label
      }
    }
    */
  }
}
</script>

<style>

</style>
