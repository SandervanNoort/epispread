import axios from 'axios'
import EventBus from 'src/bus'
import { geoArea } from 'd3-geo'
import topojsonFeature from 'topojson-client/src/feature'
import _ from 'lodash'
import getDatelabel from 'src/tools/getDatelabel'
import { getLogger } from 'src/plugins/logger'
import getExt from 'src/tools/getExt'
import Csv from './csv'
import { Parser } from 'expr-eval'
import DataGenerator from './date_generator'
import getDate from 'src/tools/getDate'

let datasets = {}
let logger = getLogger('data')

let getTopo = async function (file) {
  let data = await getData(file)
  return data
}

let getLocation = function (dataset) {
  let location = dataset.$vget('source', 'location')
  if (location) {
    dataset.$vset('labels', 'labels', 'location', location)
    dataset.$vset('labels', 'labels', 'status', 'loading')
  }
  else {
    dataset.$vset('labels', 'labels', 'status', 'incomplete')
    return
  }
  return location
}

let parseValue = function (value) {
  if (!isFinite(value) || value === '' || value === null) {
    return ''
  }
  return value
}

let addRawData = function (dataset, options) {
  logger.debug('addRawData')
  let isChart = dataset.parentType === 'chart'
  let isGeo = dataset.parentType === 'geo'

  if (dataset.$vget('global', 'plugin') !== options.name) {
    for (let key of ['appearance', 'rawData', 'global', 'labels']) {
      if (key in options) {
        dataset.$vset(key, _.cloneDeep(options[key]))
      }
    }
    dataset.$vset('rawData/dataType', isChart ? 'timeseries' : 'geo')
    dataset.$vset('global', 'plugin', options.name)
  }

  let location, datecol
  if (isChart) {
    location = getLocation(dataset)
    if (!location) {
      return
    }
  }
  if (isGeo) {
    datecol = dataset.$vget('source', 'date')
    if (!datecol) {
      return
    }
    dataset.$vset('global', 'topo', options.files.topo.url)
  }

  let fnames = getFnames(options, isGeo && options.locationFunc)
  let expr
  let otherValues = {}
  if (options.formula) {
    let parser = new Parser()
    expr = parser.parse(options.formula)
    for (let fname of expr.symbols()) {
      otherValues[fname] = []
    }
  }
  let promises = fnames.map((fname) => getData(options.files[fname]))
  Promise.all(promises).then((dataList) => {
    logger.debug('addRawData promise start')
    let data = _.zipObject(fnames, dataList)
    let dataGenerator = _.zipObject(
      fnames,
      dataList.map((data) => new DataGenerator(data))
    )
    let xvals = []
    let yvals = []
    let mainData = data[fnames[0]]
    let mainGenerator = dataGenerator[fnames[0]]
    let addData = function (location, datecol, yval) {
      if (expr) {
        let date = getDate(datecol)
        try {
          let values = {}
          values[fnames[0]] = yval
          for (let fname of expr.symbols().slice(1)) {
            values[fname] = dataGenerator[fname].getClose(location, date)
          }
          for (let [fname, value] of Object.entries(values)) {
            otherValues[fname].push(parseValue(value))
          }
          yval = expr.evaluate(values)
        }
        catch (error) {
          logger.error('expr', expr, error)
        }
      }
      yvals.push(parseValue(yval))
      xvals.push(isGeo ? location : datecol)
    }

    if ('topo' in data) {
      if (options.locationFunc) {
        let ids = data.topo.geojson.features.map((feature) => {
          return [feature.id, options.locationFunc(feature.id, data)]
        })
        dataset.$vset('global', 'locations', _.fromPairs(ids))
      }
    }
    if (isChart) {
      let values = mainData.getRow(location)
      let datecols = data[fnames[0]].cols
      for (let [datecol, yval] of _.zip(datecols, values)) {
        addData(location, datecol, yval)
      }
    }
    if (isGeo) {
      let values = mainData.getCol(datecol)
      let locations = data[fnames[0]].rows
      if (!values) {
        if (mainData.cols.length === 1) {
          datecol = mainData.cols[0]
          values = mainData.getCol(datecol)
        }
        else {
          datecol = mainGenerator.getCloseDate(getDate(datecol))
          values = mainData.getCol(datecol)
        }
      }
      if (values) {
        for (let [location, yval] of _.zip(locations, values)) {
          addData(location, datecol, yval)
        }
      }
    }

    dataset.$vset('rawData/x', xvals)
    dataset.$vset('rawData/y', yvals)
    dataset.$vset('rawData/extra/vars', [])
    for (let [fname, value] of Object.entries(otherValues)) {
      if (options.files[fname].labels) {
        dataset.$vpush('rawData/extra/vars', fname)
        dataset.$vset(
          `rawData/extra/${fname}Unit`,
          options.files[fname].labels.unit)
        dataset.$vset(`rawData/extra/${fname}`, value)
      }
    }
    if (isChart && options.locationFunc) {
      let locationLabel = options.locationFunc(location, data)
      dataset.$vset('labels', 'labels', 'location', locationLabel)
    }
    if (isChart) {
      dataset.$vdelete('labels', 'labels', 'status')
    }
    logger.debug('addRawData promise end')
  }).catch((error) => {
    logger.error('fillXY for dataset', dataset.name, error.message)
    dataset.$vset('labels', 'labels', 'status', 'Error')
  })
}

let addFields = function (dataset, options) {
  let isGeo = dataset.parentType === 'geo'
  let isChart = dataset.parentType === 'chart'

  let field = isGeo ? 'date' : 'location'

  let fnames = getFnames(options)
  let promises = fnames.map((fname) => getData(options.files[fname]))

  Promise.all(promises).then((dataList) => {
    if (isChart) {
      // since there is an overall geo.date value
      dataset.$vpush('source', '$names', field)
      dataset.$vpush('source', '$names', 'followMap')
    }
    let data = _.zipObject(fnames, dataList)
    let values = dataList[0][isGeo ? 'cols' : 'rows'].slice()
    if (isGeo) {
      dataset.$vset('source', '$dates', {
        options: values,
        type: 'text'
      })
      return
    }
    dataset.$vset('source', `$config_${field}`, {
      options: values,
      type: 'text'
    })
    if (isChart && !options.locationFunc) {
      return
    }
    let selectOptions = values.map((value) => {
      let label = value
      if (isGeo) {
        label = getDatelabel(value)
      }
      else {
        try {
          label = options.locationFunc(value, data)
        }
        catch (error) {
          logger.error('Cannot evaluate', options.location, error)
        }
      }
      return {
        value: value,
        label: label,
        sublabel: value
      }
    })
    dataset.$vset('source', `$config_${field}`, 'selectOptions', selectOptions)
  })
}

let getFnames = function (options, addTopo) {
  let fnames = Object.keys(options.files)

  if (!addTopo) {
    fnames = fnames.filter((fname) => fname !== 'topo')
  }

  if (fnames.length > 1) {
    let fname
    if (options.formula) {
      let parser = new Parser()
      let expr = parser.parse(options.formula)
      fname = expr.symbols()[0]
    }
    else if (fnames.includes('data')) {
      fname = 'data'
    }
    if (fname && fnames.indexOf(fname) > 0) {
      fnames.splice(fnames.indexOf(fname), 1)
      fnames.unshift(fname)
    }
  }
  return fnames
}

let topoParse = function (data) {
  let layer = Object.keys(data.objects)[0]
  data = {
    topojson: data,
    layer: layer,
    geojson: topojsonFeature(data, data.objects[layer])
  }
  data.geojson.features.map((feature) => {
    feature.properties.area = Math.round(
      510072000 * geoArea(feature) / 12.56637
      // geoArea(feature) * 6371 * 6371
    )
    feature.properties.id = feature.id
    // datas.properties[feature.id] = feature.properties
  })
  return data
}

let getData = async function (file) {
  let url = file.url
  let data
  if (!(url in datasets)) {
    datasets[url] = 'download'
    let value
    try {
      logger.debug('start downloading', url)
      value = await axios.get(url)
      logger.debug('finish downloading', url)
    }
    catch (error) {
      datasets[url] = null
      EventBus.$emit('download', url)
      throw error
    }
    data = value.data
    if (file.parse === 'csv' || getExt(url) === 'csv') {
      logger.debug('start csvparse', url)
      data = new Csv(data)
      logger.debug('end csvparse', url)
    }
    else if (file.parse === 'topojson' || getExt(url) === 'topojson') {
      data = topoParse(data)
    }
    else {
      logger.info('Not parsing', url)
    }
    datasets[url] = data
    EventBus.$emit('download', url)
  }
  else if (datasets[url] === 'download') {
    data = await new Promise((resolve, reject) => {
      EventBus.$on('download', (ready) => {
        if (ready === url) {
          if (datasets[url] === null) {
            reject(Error('Unavailable ' + url))
          }
          else {
            resolve(datasets[url])
          }
        }
      })
    })
  }
  else if (datasets[url] === null) {
    throw new Error('unavailable', url)
  }
  else {
    data = datasets[url]
  }
  return data
}

export { getData, topoParse, getTopo, addFields, addRawData, getFnames }
