<template>
<div
    :style="{
      height: height + 'px',
      width: width + 'px',
      float: 'left'
    }">
  <tooltip
    ref='tooltip'
    :module="module"
    @mouse="tooltipMouse"
    :hoverKey="hoverKey" />
  <svg :width="width" :height="height">
    <defs>
      <pattern
          :id="hatch"
          width='8'
          height='8'
          :patternTransform="'rotate(45 0 0) scale(' + 1 / transform.k + ')'"
          patternUnits='userSpaceOnUse'>
        <line x1=0 y1=0 x2=0 y2=8 style='stroke:black; stroke-width:3' />
      </pattern>
    </defs>
    <rect
      x='0'
      y='0'
      :width="width"
      :height="height"
      :style="{fill: backgroundColor}"
      @mouseover="mouseover($event)" />
    <g :transform="transform">
      <dataset v-for="datasetKey in datasetList" :key="datasetKey"
        :name="datasetKey"
        :parent="module" />
      <g v-for="topo in toposActive">
        <path v-for="feature in paths[topo].geojson.features" :key="feature.id"
          @mouseover.stop="mouseover($event, feature)"
          :style="{fill: feature.color}"
          :d="feature.path" />
      </g>
      <!--    :style="{fill: feature.color}" -->
      <!-- :style="{fill: getColor(values[feature.id])}" -->
      <!--  :style="{fill: 'rgba(0, 0, 0, 0.5)'}" -->
      <path v-if="hoverFeature"
        :style="{
          fill: 'url(#' + hatch + ')',
          stroke: 'black',
          strokeWidth: 1 / transform.k
        }"
        :d="hoverFeature.path" />
    </g>
    <rect v-if="dateBox"
      @click.stop="geoPlay"
      :x="dateBox.x"
      :y="dateBox.y"
      :style="{cursor: 'pointer'}"
      :height="dateBox.height"
      :width="dateBox.width"
      :fill="backgroundColor" />
    <text v-if="dateLabel"
        :style="{cursor: 'pointer'}"
        ref='dateText'
        @click.stop="geoPlay"
        :x="dateLoc.x"
        :y="dateLoc.y"
        :text-anchor="dateLoc.textAnchor">
      {{ dateLabel }}
    </text>
    <geo-legend :geo="module" />
  </svg>
</div>
</template>

<script>
import '@/chart/geoSettings'
import { zoomTransform, zoomIdentity, zoom } from 'd3-zoom'
import { event, select } from 'd3-selection'
import { min, max } from 'd3-array'
import { geoMercator, geoPath } from 'd3-geo'
import Dataset from './dataset'
import { getData } from 'src/source/data'
import _ from 'lodash'
// import getLabel from 'src/tools/getLabel'
import getDatelabel from 'src/tools/getDatelabel'
import { QPopover, QBtn } from 'quasar'
import Tooltip from './tooltip'
import geoLegend from './geoLegend'
import { addWatch, addComputed, autoWatch } from 'src/storeTools'
import getFormat from 'src/tools/getFormat'

export default {
  name: 'geo',
  props: ['name', 'height', 'width'],
  data () {
    return {
      transform: zoomTransform({scale: 1, translate: [0, 0]}),
      xyHover: null,
      paths: {},
      hoverFeature: null,
      hoverKey: null,
      toposActivePrev: [],
      patternScale: 1,
      dateBox: null,
      keepZoom: false
    }
  },
  computed: {
    ...addComputed({
      backgroundColor: 'appearance/backgroundColor',
      label: 'label',
      date: 'date',
      autoZoom: 'autoZoom',

      yFormat: 'legend/yFormat',
      datasets: 'datasets',
      zoomDuration: '/global/zoom/duration',
      zoomStep: '/global/zoom/step',
      zoomPosition: 'appearance/zoomPosition',
      border: 'appearance/border',
      minValue: 'legend/minValue',
      maxValue: 'legend/maxValue',
      log: 'legend/log',
      scale: 'legend/_status/scale',
      dLabel: 'datasets/this.mainKey/label'
    }),
    hatch () { return 'diagonalHatchGeo' + this.name },
    module () { return `/geos/${this.name}` },
    datasetList () {
      return Object.keys(this.datasets)
        .filter((key) => this.datasets[key].active)
        .sort((key1, key2) => {
          return this.datasets[key1].order > this.datasets[key2].order
        })
    },
    mainDatasetList () {
      return this.datasetList.filter((datasetKey) => {
        return this.datasets[datasetKey].label === this.dLabel
      })
    },
    mainKey () {
      if (this.datasetList.length > 0) {
        return this.datasetList[0]
      }
    },
    dates () {
      let dates = []
      for (let datasetKey of this.mainDatasetList) {
        let configDate = this.$vget(`datasets/${datasetKey}/source/$dates`)
        if (configDate) {
          dates = _.union(dates, configDate.options)
        }
      }
      return dates
    },
    labelAuto () {
      let [factor, _func] = getFormat(this.yFormat)
      return `${this.dLabel} ${factor}`
    },
    dateLabel () {
      if (this.date && this.dates.length > 1) {
        return getDatelabel(this.date)
      }
    },
    values () {
      let values = {}
      for (let datasetKey of this.mainDatasetList) {
        let yvals = this.$vget('datasets', datasetKey, 'rawData', 'y')
        let locations = this.$vget('datasets', datasetKey, 'rawData', 'x')
        for (let [location, yval] of _.zip(locations, yvals)) {
          values[location] = yval
        }
      }
      return values
    },
    legendValues () {
      for (let datasetKey of this.datasetList) {
        let legend = this.$vget('datasets', datasetKey, 'global', 'legend')
        if (legend) {
          return [legend.min, legend.max, legend.log]
        }
      }
    },
    topos () {
      let topos = []
      this.$logger.error('topos')
      for (let datasetKey of this.datasetList) {
        let topo = this.$vget('datasets', datasetKey, 'global', 'topo')
        let locations = this.$vget('datasets', datasetKey, 'global', 'locations')
        if (!topo) {
          continue
        }
        if (!(topo in this.paths)) {
          this.$set(this.paths, topo, {})
          getData({url: topo}).then((topoData) => {
            this.$set(this.paths, topo, topoData)
            this.$set(topoData, 'bounds', this.path.bounds(topoData.geojson))
            topoData.geojson.features.map(feature => {
              this.$set(feature, 'path', this.path(feature))
              if (locations && feature.id in locations) {
                this.$set(feature, 'properties', 'label', locations[feature.id])
              }
              feature.color = this.getColor(this.values[feature.id])
            })
          })
        }
        if (!topos.includes(topo)) {
          topos.push(topo)
        }
      }
      return topos
    },
    toposActive () {
      let toposActive = this.topos.filter(
        (topo) => 'geojson' in this.paths[topo]
      )

      // caching
      if (toposActive.length === 0) {
        return this.toposActivePrev
      }
      this.toposActivePrev = toposActive

      return toposActive
    },
    bounds () {
      let xmin, xmax, ymin, ymax
      for (let topo of this.toposActive) {
        let bounds = this.paths[topo].bounds
        if (bounds) {
          xmin = min([xmin, bounds[0][0]])
          ymin = min([ymin, bounds[0][1]])
          xmax = max([xmax, bounds[1][0]])
          ymax = max([ymax, bounds[1][1]])
        }
      }
      if (xmin === undefined) {
        return
      }
      return [xmin, xmax, ymin, ymax]
    },
    zoomComplete () {
      if (!this.bounds) {
        return
      }
      let [xmin, xmax, ymin, ymax] = this.bounds
      let width = this.width // - this.settings.legend)
      let height = this.height // Math.max(50)
      let dx = xmax - xmin
      let dy = ymax - ymin
      let cx = (xmax + xmin) / 2
      let cy = (ymax + ymin) / 2

      let relScale = Math.min(
        (width - 2 * this.border) / dx,
        (height - 2 * this.border) / dy
      )
      // scale *= relScale
      // translate = [relScale * translate[0], relScale * translate[1]]
      // now center is at relScale * (cx, cy)

      let translate = [-relScale * cx, -relScale * cy]
      // now center is at (0,0)

      if (this.zoomPosition === 'left') {
        translate = [
          translate[0] + relScale * dx / 2 + this.border,
          translate[1] + height / 2
        ]
      }
      else if (this.zoomPosition === 'center') {
        translate = [translate[0] + width / 2, translate[1] + height / 2]
      }
      return zoomIdentity.translate(translate[0], translate[1]).scale(relScale)
    },
    projection () {
      return geoMercator()
    },
    path () {
      return geoPath().projection(this.projection)
    },
    dateLoc () {
      return {
        x: 5,
        y: 5 + 12,
        textAnchor: 'start'
      }
    },
    strokeWidth () {
      let strokeWidth = 2
      if (this.transform) {
        strokeWidth /= this.transform.k
      }
      return strokeWidth
    },
    lonlatHover () {
      if (!this.xyHover) {
        return
      }
      let xy = (this.transform)
        ? this.transform.invert(this.xyHover)
        : this.xyHover
      return this.projection.invert(xy)
    }
  },
  mounted () {
    this.zoom = zoom()
      .scaleExtent([1 / this.zoomStep, this.zoomStep])
      .on('zoom', () => {
        this.transform = event.transform
        if (!this.transform || !this.zoomComplete) {
          return
        }
        this.zoom.scaleExtent([
          this.transform.k / this.zoomStep,
          this.transform.k * this.zoomStep
        ])
        if (!this.autoZoom) {
          return
        }
        let zoomed = () => {
          this.keepZoom = true
          this.hoverFeature = null
          this.hoverKey = null
        }
        for (let datasetKey of this.datasetList) {
          let minZoom = this.$vget(`datasets/${datasetKey}/global/zoom/min`)
          let maxZoom = this.$vget(`datasets/${datasetKey}/global/zoom/max`)
          let currentZoom = this.transform.k / this.zoomComplete.k
          if (currentZoom > maxZoom) {
            zoomed()
            let update = this.$vget(`datasets/${datasetKey}/global/zoom/maxUpdate`)
            for (let [key, value] of Object.entries(update)) {
              this.$vset(`datasets/${datasetKey}/source/${key}`, value)
            }
          }
          else if (currentZoom < minZoom) {
            zoomed()
            let update = this.$vget(`datasets/${datasetKey}/global/zoom/minUpdate`)
            for (let [key, value] of Object.entries(update)) {
              this.$vset(`datasets/${datasetKey}/source/${key}`, value)
            }
          }
        }
        // this.dispatch.call('set', this, ['zoom', this.totalZoom])
        // this.zoomedEnd()
      })
      .on('end.zoom', () => {
        // this.dispatch.call('set', this, ['zoomedEnd'])
        // this.zoomedEnd(event.transform)
      })
    this.svg = this.$el.querySelector('svg')
    this.$q.events.$on('resetZoom', this.resetZoom)
    this.zoom(select(this.svg))
  },
  inject: ['layout'],
  methods: {
    getDateBox () {
      let box = this.$refs.dateText.getBBox()
      box.width += box.x
      box.height += box.y
      box.x = 0
      box.y = 0
      return box
    },
    geoPlay () {
      this.$vset('/_status/action', 'geo-play')
      this.$vset('/_status/actionValues/module', this.module)
      this.layout.showRight()
    },
    mouseover (event, feature) {
      this.hoverFeature = feature
      this.hoverKey = feature ? feature.id : null
    },
    tooltipMouse (event) {
      if (event === null) {
        this.xyHover = null
        return
      }
      let rect = this.$el.getBoundingClientRect()
      this.xyHover = [event.pageX - rect.left, event.pageY - rect.top]
      this.$refs.tooltip.$el.style.display = 'block'
    },
    resetZoom (time) {
      select(this.svg)
        .transition()
        .duration(time === undefined ? this.zoomDuration : time)
        .call(
          this.zoom.transform,
          this.zoomComplete
        )
    },
    getColor (value) {
      if (value === undefined) {
        return 'white'
      }
      return this.scale(value)
    }
  },
  beforeCreate () {
    this.$options.components.QTooltip = require('@/tooltip/QTooltip.vue')
  },
  watch: {
    hoverKey (value) {
      this.$vset('/_status/hoverKey', value)
    },
    ...addWatch(['width', 'height', 'xyHover', 'datasetList']),
    ...autoWatch(['label']),
    values: {
      immediate: true,
      handler (values) {
        if (Object.keys(values).length === 0) {
          return
        }
        for (let topo of this.toposActive) {
          for (let feature of this.paths[topo].geojson.features) {
            feature.color = this.getColor(values[feature.id])
          }
        }
      }
    },
    legendValues: {
      immediate: true,
      deep: true,
      handler (value) {
        if (!value) {
          value = [null, null, null]
        }
        this.$vdefault('legend/minValue', value[0])
        this.$vdefault('legend/maxValue', value[1])
        this.$vdefault('legend/log', value[2])
      }
    },
    dateLabel: {
      immediate: true,
      handler (value) {
        if (value) {
          this.$nextTick(() => { this.dateBox = this.getDateBox() })
        }
        else {
          this.dateBox = null
        }
      }
    },
    bounds (value, oldValue) {
      if (_.isEqual(value, oldValue)) {
        return
      }
      if (value) {
        if (this.keepZoom) {
          this.keepZoom = false
        }
        else {
          this.resetZoom(0)
        }
      }
    },
    date: {
      immediate: true,
      handler (value) {
        for (let datasetKey of this.datasetList) {
          this.$vset(`datasets/${datasetKey}/source/date`, value)
        }
      }
    },
    dates (dates) {
      let selectOptions = dates.map((value) => {
        let label = getDatelabel(value)
        return {
          value: value,
          label: label,
          sublabel: value
        }
      })
      this.$vset('$config_date', {
        type: 'text',
        options: dates,
        selectOptions: selectOptions
      })
      if (!dates.includes(this.date) && dates.length > 0) {
        this.date = dates[0]
      }
    }
  },
  components: {
    Dataset,
    QPopover,
    QBtn,
    Tooltip,
    geoLegend
  }
}
</script>
