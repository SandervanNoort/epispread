import _ from 'lodash'

let DateGenerator = function (csvObj) {
  this.data = csvObj
  this.index = -1
}

DateGenerator.prototype.nextDate = function () {
  this.index += 1
  return this.data.dates[this.index]
}

DateGenerator.prototype.nextDatecol = function () {
  this.index += 1
  return [this.data.datecols[this.index], this.data.dates[this.index]]
}

DateGenerator.prototype.getCloseDate = function (closeDate) {
  for (let [datecol, date] of _.zip(this.data.cols, this.data.dates)) {
    if (date >= closeDate) {
      return datecol
    }
  }
  return this.data.cols[-1]
}

DateGenerator.prototype.getClose = function (location, closeDate) {
  let values = this.data.getRow(location)
  let lastValue
  for (let [date, value] of _.zip(this.data.dates, values)) {
    if (value === '') {
      continue
    }
    if (date >= closeDate) {
      return value
    }
    lastValue = value
  }
  return lastValue
}

export { DateGenerator as default }
