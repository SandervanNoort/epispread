import getDate from 'src/tools/getDate'

export default function (rawData) {
  let index = 0
  let timeseries = []
  let valid = true
  while (valid) {
    let row = {}
    if (rawData.xy && rawData.xy.length > index) {
      row.xval = rawData.xy[index][0]
      row.yval = rawData.xy[index][1]
    }
    if (row.xval === undefined && rawData.x && rawData.x.length > index) {
      row.xval = rawData.x[index]
    }
    if (row.yval === undefined && rawData.y && rawData.y.length > index) {
      row.yval = rawData.y[index]
      if (!rawData.x && !rawData.xy) {
        row.xval = index
      }
    }
    if ('xval' in row) {
      if (rawData.xType.match(/date/i)) {
        let date = getDate(row.xval)
        if (date !== null) {
          row.date = true
          row.xorig = row.xval
          row.xval = date.valueOf()
        }
        else {
          delete row.xval
        }
      }
      else if (rawData.xType.match(/number/i)) {
        if (!(isFinite(row.xval))) {
          delete row.xval
        }
      }
    }
    if (rawData.extras) {
      for (let key of rawData.extras) {
        row[key] = rawData[key][index]
      }
    }
    if ('xval' in row && 'yval' in row) {
      timeseries.push(row)
    }
    else {
      valid = false
    }
    index += 1
  }
  return timeseries
}
