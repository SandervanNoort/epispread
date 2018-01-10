<template>
<div id='main' :style="{height: height + 'px', width: width + 'px'}">
  <geo v-for="geo in geoList" :key="geo"
    :name="geo"
    :width="geoWidth"
    :height="geoHeight" />
  <chart v-for="chart in chartList" :key="chart"
    :name="chart"
    :height="chartHeight"
    :width="chartWidth" />
</div>
</template>

<script>
import Chart from '@/chart/chart'
import Geo from '@/chart/geo'
import '@/chart/datasetSettings'
import { addComputed } from 'src/storeTools'
import { Toast } from 'quasar'

export default {
  name: 'main-div',
  components: { Chart, Geo },
  props: ['height', 'width'],
  computed: {
    ...addComputed({
      'charts': 'charts',
      'geos': 'geos',
      'messages': '_status/messages'
    }),
    chartList () {
      return Object.keys(this.charts)
        .filter((chart) => this.charts[chart].active)
        .sort((chart1, chart2) => this.charts[chart1].appearance.id >
          this.charts[chart2].appearance.id)
    },
    geoList () {
      return Object.keys(this.geos)
        .filter((geo) => this.geos[geo].active)
        .sort((geo1, geo2) => this.geos[geo1].appearance.id >
          this.geos[geo2].appearance.id)
    },
    chartHeight () {
      let height = this.height / this.chartList.length
      if (this.geoList.length > 0) {
        height /= 2
      }
      return height
    },
    geoHeight () {
      let height = this.height
      if (this.chartList.length > 0) {
        height /= 2
      }
      return height
    },
    chartWidth () { return this.width },
    geoWidth () { return this.width / this.geoList.length }
  },
  data () {
    return {
      diffX: 0
    }
  },
  mounted () {
    this.$q.events.$on('error', function (message) {
      Toast.create.negative(message)
    })
  },
  methods: {
    boxResize (resize) {
      if ('x' in resize) {
        this.diffX += resize.x
      }
    }
  },
  watch: {
    'messages': function (value) {
      if (value && value.length > 0) {
        Toast.create(value.join('<hr>'))
        this.messages = null
      }
    }
  }
}
</script>
