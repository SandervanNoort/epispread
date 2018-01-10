import _ from 'lodash'

let axSettings = {
  label: {
    type: 'text',
    default: '',
    $id: 1
  },
  minValue: {
    type: 'float',
    default: '',
    allowed: [''],
    $id: 2
  },
  tickFormat: {
    type: 'text',
    default: 's',
    $id: 3
  },
  appearance: {
    labelDistance: {
      type: 'int',
      default: 10
    },
    border: {
      type: 'int',
      default: 5
    },
    margin: {
      type: 'int',
      default: 60
    },
    distance: {
      type: 'int',
      default: 40
    },
    tickSizeOuter: {
      type: 'int',
      default: 0
    },
    fontSize: {
      type: 'int',
      default: 14
    },
    tickDistance: {
      type: 'int',
      default: 20
    }
  },
  _status: {
    labelAuto: {type: 'text'}
  }
}

let settings = {
  left: _.cloneDeep(axSettings),
  right: _.cloneDeep(axSettings),
  bottom: _.cloneDeep(axSettings)
}

settings.left.label.default = 'Y Label'
settings.right.label.default = 'Y2 Label'
settings.left.label.default = 'X Label'
settings.bottom.appearance.tickDistance.default = 90

export default settings
