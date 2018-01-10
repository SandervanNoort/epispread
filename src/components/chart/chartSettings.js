import { addConfig } from 'src/storeTools'
import store from 'src/store'
import { schemeCategory10, scaleLinear } from 'd3-scale'
import axSettings from './axSettings'

let settings = {
  label: {
    type: 'text',
    $id: 1
  },
  appearance: {
    axColor: {
      type: 'color',
      default: 'white'
    },
    backgroundColor: {
      type: 'color',
      default: '#ccc'
    },
    datasetColors: {
      type: 'array',
      hidden: true,
      default () { return schemeCategory10 }
    },
    datasetsTaken: {
      type: 'array',
      hidden: true,
      default () { return [] }
    },
    topMargin: {
      type: 'int',
      default: 15
    },
    border: {
      type: 'int',
      default: 10
    },
    legendWidth: {
      type: 'int',
      default: 150
    },
    titleSize: {
      default: 20,
      type: 'int'
    }
  },
  scales: {
    type: 'auto',
    default () {
      return {
        left: scaleLinear(),
        _left: 0,
        right: scaleLinear(),
        _right: 0,
        bottom: scaleLinear(),
        _bottom: 0
      }
    }
  },
  active: {
    default: true,
    type: 'bool',
    hidden: true
  },
  _status: {
    xyHover: {type: 'array', default: null},
    xHover: {type: 'float', default: null},
    topMargin: {type: 'int'},
    commonLabels: {type: 'json'},
    datasetList: {type: 'array'},
    clipURL: {type: 'text'},
    leftLabel: {type: 'text'},
    rightLabel: {type: 'text'},
    xDomain: {type: 'array'}
  }
}
settings.axes = axSettings
addConfig(store, ['charts'], {multiple: settings, $prefix: 'chart'})
