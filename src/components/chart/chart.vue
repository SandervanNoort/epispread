<template>
<div
    class='chart'
    :style="{height: height + 'px', width: width + 'px', display: 'flex'}">
  <tooltip ref='tooltip' :module="module" @mouse="tooltipMouse" />
  <svg
     :width="chartWidth"
     :height="height"
     :style="{ backgroundColor: backgroundColor }" >
    <defs>
      <pattern
          :id="hatch"
          width='8'
          height='8'
          patternTransform='rotate(45 0 0)'
          patternUnits='userSpaceOnUse'>
        <line x1=0 y1=0 x2=0 y2=8 style='stroke:black; stroke-width:3' />
      </pattern>
    </defs>
    <g ref='g'>
      <text
          @click="leftMenu = module; layout.showLeft()"
          :x="title.x"
          :y="title.y"
          text-anchor='title.textAnchor'
          :style="{fontSize: titleSize + 'px'}">
        {{label}}
      </text>
      <clipPath :id="clipName">
        <epi-rect
          :chartProp="module"
          :rawDataProp="axRect"
          :appearanceProp="{}" />
      </clipPath>
      <epi-rect
        :chartProp="module"
        :rawDataProp="axRect"
        :appearanceProp="{color: axColor}" />
      <epi-axis v-for="(ax, axName) in axes" key="axName"
        :name="axName"
        :chart="module" />
      <dataset v-for="(datasetKey, index) in datasetList" :key="datasetKey"
        :name="datasetKey"
        :parent="module" />
    </g>
  </svg>
  <chart-legend :chart="module" />
</div>
</template>

<script>

import { min, max } from 'd3-array'
import { scaleTime, scaleLinear } from 'd3-scale'
import { zoom, zoomIdentity } from 'd3-zoom'
import { event, select } from 'd3-selection'

import '@/chart/chartSettings'
import epiAxis from './axis'
import epiLine from './line'
import epiRect from './rect'
import Dataset from './dataset'
import ChartLegend from './chartLegend'
import { addWatch, addComputed } from 'src/storeTools'
import _ from 'lodash'
import getLabel from 'src/tools/getLabel'
import Tooltip from './tooltip'
import xyMixin from './xyMixin'

export default {
  name: 'chart',
  components: {
    epiLine,
    epiRect,
    epiAxis,
    Dataset,
    ChartLegend,
    Tooltip
  },
  props: ['height', 'width', 'name'],
  mixins: [xyMixin],
  data () {
    return {
      transform: null,
      axRect: {x: ['x0', 'x1'], y: ['y0', 'y1']},
      xDomainZoom: null,
      xyHover: null,
      transformK: 1
    }
  },
  inject: ['layout'],
  computed: {
    ...addComputed({
      duration: '/global/zoom/duration',
      zoomStep: '/global/zoom/step',
      titleSize: 'appearance/titleSize',
      leftMenu: '/_status/leftMenu',
      legendWidth: 'appearance/legendWidth',
      topSpace: 'appearance/topMargin',
      border: 'appearance/border',
      leftMargin: 'axes/left/appearance/margin',
      leftMin: 'axes/left/minValue',
      rightMargin: 'axes/right/appearance/margin',
      rightMin: 'axes/right/minValue',
      bottomMargin: 'axes/bottom/appearance/margin',
      scales: 'scales',
      axColor: 'appearance/axColor',
      backgroundColor: 'appearance/backgroundColor',
      axes: 'axes',
      datasets: 'datasets',
      label: 'label'
    }),
    title () {
      return {
        x: this.leftMargin,
        y: this.titleSize + this.topSpace / 2,
        textAnchor: 'left'
      }
    },
    clipURL () { return 'url(#clip' + this.name + ')' },
    hatch () { return 'diagonalHatchChart' + this.name },
    chartWidth () { return this.width - this.legendWidth },
    datasetListAll () {
      this.$logger.debug('compute datasetListAll')
      return Object.keys(this.datasets)
        .filter((key) => this.datasets[key].active)
        .sort((key1, key2) => {
          return this.datasets[key1].order > this.datasets[key2].order
        })
    },
    validDatasets () {
      this.$logger.debug('compute validDatasets')
      let yLabels = []
      let xTypes = []
      let datasetList = []
      let yFormats = []
      let errors = []
      let minValues = []
      for (let datasetKey of this.datasetListAll) {
        let yLabel = this.$vget(`datasets/${datasetKey}/labels/yLabel`) || ''
        let yFormat = this.$vget(`datasets/${datasetKey}/labels/yFormat`)
        let xType = this.$vget(`datasets/${datasetKey}/rawData/xType`)
        let minValue = this.$vget(`datasets/${datasetKey}/global/minValue`)

        if (yLabel !== '' && !yLabels.includes(yLabel) && yLabels.length === 2) {
          this.$logger.error('Current ylabels: ', yLabels, 'rejected:', yLabel)
          // this.$q.events.$emit('error', 'Too many ylabels')
          errors.push('Too many ylabels')
          continue
        }
        if (xType !== '' && !xTypes.includes(xType) && xTypes.length === 1) {
          this.$logger.error('Current xTypes: ', xTypes, 'rejected:', xType)
          errors.push('Too many xtypes')
          continue
        }

        if (yLabel !== '' && !yLabels.includes(yLabel)) {
          yFormats.push(yFormat)
          yLabels.push(yLabel)
          minValues.push(minValue)
        }
        if (xType !== '' && !xTypes.includes(xType)) {
          xTypes.push(xType)
        }
        datasetList.push(datasetKey)
      }
      return [datasetList, yLabels, xTypes, yFormats, errors, minValues]
    },
    errors () {
      return this.validDatasets[4]
    },
    yLabels () {
      return this.validDatasets[1]
    },
    minValues () {
      return this.validDatasets[5]
    },
    yFormats () {
      return this.validDatasets[3]
    },
    datasetList () {
      return this.validDatasets[0]
    },
    xType () {
      return this.validDatasets[2][0] || 'linear'
    },
    leftLabel () {
      return this.yLabels[0]
    },
    leftFormat () {
      return this.yFormats[0]
    },
    leftMinAuto () {
      return this.minValues[0]
    },
    rightMinAuto () {
      return this.minValues[1]
    },
    rightLabel () {
      return this.yLabels[1]
    },
    rightFormat () {
      return this.yFormats[1]
    },
    module () { return `/charts/${this.name}` },
    clipName () { return 'clip' + this.name },
    axWidth () { return this.chartWidth - this.leftMargin - this.rightMargin },
    xWidth () { return this.xDomain[1] - this.xDomain[0] },
    xMargins () {
      return [
        this.leftMargin * (this.xWidth / this.axWidth),
        this.rightMargin * (this.xWidth / this.axWidth)
      ]
    },
    xDomainFull () {
      return [
        this.xDomain[0] - this.xMargins[0],
        this.xDomain[1] + this.xMargins[1]
      ]
    },
    commonLabels () {
      return _.intersectionBy.apply(this,
        this.datasetList.map(
          (datasetKey) => {
            let labels = this.$vget(`datasets/${datasetKey}/labels/labels`)
            if (labels) {
              return Object.entries(labels)
            }
            else {
              return []
            }
          }
        ).concat((val) => val.join('_'))
      )
    },
    autoLabel () {
      if (this.commonLabels) {
        return getLabel(this.commonLabels)
      }
    },
    xLabel () {
      let xLabels = []
      for (let datasetKey of this.datasetList) {
        let xLabelDataset = this.$vget(`datasets/${datasetKey}/labels/xLabel`)
        if (xLabelDataset) {
          if (!xLabels.includes(xLabelDataset)) {
            xLabels.push(xLabelDataset)
          }
        }
      }
      if (xLabels.length === 1) {
        return xLabels[0]
      }
    },
    leftDomain () {
      let yDomain = [null, null]
      for (let datasetKey of this.datasetList) {
        let yLabel = this.$vget(`datasets/${datasetKey}/labels/yLabel`)
        if (yLabel && this.leftLabel !== yLabel) {
          continue
        }
        let subdomain = this.$vget(`datasets/${datasetKey}/_status/yDomain`)
        if (subdomain) {
          yDomain[0] = min([yDomain[0], subdomain[0]])
          yDomain[1] = max([yDomain[1], subdomain[1]])
        }
      }
      if (yDomain[0] === null) {
        return [0, 0]
      }
      yDomain[0] = this.leftMin === '' ? yDomain[0] : this.leftMin

      if (this.height) {
        let yborder = this.border / this.height
        // yDomain[0] -= yborder * (yDomain[1] - yDomain[0])
        yDomain[1] += yborder * (yDomain[1] - yDomain[0])
      }
      return yDomain
    },
    rightDomain () {
      let yDomain = [null, null]
      for (let datasetKey of this.datasetList) {
        let yLabel = this.$vget(`datasets/${datasetKey}/labels/yLabel`)
        if (this.rightLabel !== yLabel) {
          continue
        }
        let subdomain = this.$vget(`datasets/${datasetKey}/_status/yDomain`)
        if (subdomain) {
          yDomain[0] = min([yDomain[0], subdomain[0]])
          yDomain[1] = max([yDomain[1], subdomain[1]])
        }
      }
      if (yDomain[0] === null) {
        return [0, 0]
      }
      yDomain[0] = this.rightMin === '' ? yDomain[0] : this.rightMin

      if (this.height) {
        let yborder = this.border / this.height
        // yDomain[0] -= yborder * (yDomain[1] - yDomain[0])
        yDomain[1] += yborder * (yDomain[1] - yDomain[0])
      }
      return yDomain
    },
    xDomain () {
      let xDomain = [null, null]
      for (let datasetKey of this.datasetList) {
        let subdomain = this.$vget(`datasets/${datasetKey}/_status/xDomain`)
        if (subdomain) {
          xDomain[0] = min([xDomain[0], subdomain[0]])
          xDomain[1] = max([xDomain[1], subdomain[1]])
        }
      }
      if (xDomain[0] === null) {
        return [0, 0]
      }

      if (this.chartWidth) {
        let xborder = this.border / this.chartWidth
        xDomain[1] += xborder * (xDomain[1] - xDomain[0])
        xDomain[0] -= xborder * (xDomain[1] - xDomain[0])
      }
      return xDomain
    },
    xRange () {
      return [this.leftMargin, this.chartWidth - this.rightMargin]
    },
    topMargin () {
      return this.topSpace + (this.label !== '' ? this.titleSize : 0)
    },
    yRange () {
      return [
        this.height - this.bottomMargin,
        this.topMargin
      ]
    },
    xDomainShow () {
      if (this.xDomainZoom === null) {
        return this.xDomain
      }
      return this.xDomainZoom
    },
    xHover () {
      let xMins = []
      for (let datasetKey of this.datasetList) {
        let subxMin = this.$vget(`datasets/${datasetKey}/_status/xMin`)
        if (subxMin) {
          xMins.push(subxMin)
        }
      }
      let xMin = _.minBy(xMins, (xMin) => xMin[1])
      if (xMin) {
        return xMin[0]
      }
    }
  },
  watch: {
    ...addWatch(['xHover', 'xyHover', 'topMargin', 'commonLabels',
      'datasetList', 'clipURL', 'hatch', 'leftLabel', 'rightLabel', 'xLabel',
      'leftFormat', 'rightFormat', 'leftMinAuto', 'rightMinAuto']),
    errors (value) {
      if (value) {
        for (let error of value) {
          this.$vpush('/_status/messages', error)
        }
      }
    },
    autoLabel: {
      immediate: true,
      handler (value) {
        this.label = value
      }
    },
    xRange: {
      immediate: true,
      handler (value) {
        this.scales.bottom.range(value)
        this.scales._bottom += 1
        this.updateTransform()
      }
    },
    yRange: {
      immediate: true,
      handler (value) {
        this.scales.left.range(value)
        this.scales._left += 1
        this.scales.right.range(value)
        this.scales._right += 1
      }
    },
    leftDomain (value) {
      this.scales.left.domain(value)
      this.scales._left += 1
    },
    rightDomain (value) {
      this.scales.right.domain(value)
      this.scales._right += 1
    },
    xDomainShow (value) {
      this.scales.bottom.domain(value)
      this.scales._bottom += 1
    },
    xType: {
      immediate: true,
      handler (value) {
        let scaleFunc = value.match(/date/i) ? scaleTime : scaleLinear
        this.scales.bottom = scaleFunc()
          .range(this.xRange)
          .domain(this.xDomainShow)
        this.scales._bottom += 1
      }
    }
  },
  mounted () {
    this.zoom = zoom()
      .scaleExtent([1 / this.zoomStep, this.zoomStep])
      .on(
        'zoom',
        () => {
          if (this.xyHover && this.transform && this.transform.k === event.transform.k) {
            // when dragging, mousemove is no longer registered
            this.xyHover = [
              this.xyHover[0] + (event.transform.x - this.transform.x),
              this.xyHover[1] + (event.transform.y - this.transform.y)
            ]
            this.$refs.tooltip.xpixClient += (event.transform.x - this.transform.x)
            this.$refs.tooltip.ypixClient += (event.transform.y - this.transform.y)
            this.$refs.tooltip.setPosition()
          }
          this.transform = event.transform
          this.zoom.scaleExtent([
            this.transform.k / this.zoomStep,
            this.transform.k * this.zoomStep
          ])
          let xDomainFull = this.doTransform(
            this.xDomainFull, this.chartWidth, this.transform)
          this.xDomainZoom = [
            xDomainFull[0] + this.xMargins[0] / this.transform.k,
            xDomainFull[1] - this.xMargins[1] / this.transform.k
          ]
        }
      )
    this.svg = this.$el.querySelector('svg')
    this.$q.events.$on('resetZoom', this.resetZoom)
    this.zoom(select(this.svg))
  },
  methods: {
    tooltipMouse (event) {
      if (event === null) {
        this.xyHover = null
        return
      }
      let rect = this.$el.getBoundingClientRect()
      let xpix = event.pageX - rect.left
      let ypix = event.pageY - rect.top
      if (xpix >= this.xRange[0] && xpix <= this.xRange[1] &&
          ypix <= this.yRange[0] && ypix >= this.yRange[1]) {
        this.$refs.tooltip.$el.style.display = 'block'
        this.xyHover = [xpix, ypix]
      }
      else {
        this.$refs.tooltip.$el.style.display = 'none'
        this.xyHover = null
      }
    },
    doTransform (domain, width, transform) {
      let tmp = domain[0] + (domain[1] - domain[0]) / transform.k
      let xTranslate = transform.x * (tmp - domain[0]) / width
      return [
        domain[0] - xTranslate,
        tmp - xTranslate
      ]
    },
    getTransform (domain, width, newDomain) {
      let xTranslate = domain[0] - newDomain[0]
      let tmp = newDomain[1] + xTranslate
      return {
        k: (domain[1] - domain[0]) / (tmp - domain[0]),
        x: xTranslate * width / (tmp - domain[0])
      }
    },
    updateTransform () {
      if (this.xDomainZoom === null) {
        return
      }
      if (isNaN(this.xDomain[0])) {
        return
      }
      let xWidth = this.xDomainZoom[1] - this.xDomainZoom[0]
      let xMargins = [
        this.leftMargin * (xWidth / this.axWidth),
        this.rightMargin * (xWidth / this.axWidth)
      ]
      let xDomainFull = [
        this.xDomainZoom[0] - xMargins[0],
        this.xDomainZoom[1] + xMargins[1]
      ]
      let transform = this.getTransform(this.xDomainFull, this.chartWidth, xDomainFull)
      select(this.svg)
        // .transition()
        // .duration(this.duration)
        .call(
          this.zoom.transform,
          zoomIdentity
            .translate(transform.x, 0)
            .scale(transform.k)
        )
    },
    resetZoom () {
      // this.transform = {k: 1, x: 0}
      select(this.svg)
        .transition()
        .duration(this.duration)
        .call(
          this.zoom.transform,
          zoomIdentity
            .translate(0, 0)
            .scale(1)
        )
    }
  }
}
</script>

<style>
svg {
  margin: 0px;
  padding: 0px;
}
path {
  fill: none;
}
.chart {
  margin: 0;
  padding: 0;
}
.chartTable caption {
  font-weight: bold;
  margin-bottom: 0.5em;
  font-size: 150%;
  text-align: left;
  text-decoration: underline;
}
</style>
