import papa from 'papaparse'
import getDate from 'src/tools/getDate'
import { getLogger } from 'src/plugins/logger'

let logger = getLogger('csv')

let Csv = function (fileObj) {
  this.papa = papa.parse(fileObj, {skipEmptyLines: true, dynamicTyping: true})
  this.cols = this.papa.data[0].slice(1)
  this.rows = this.papa.data.map(row => row[0].toString()).slice(1)
  this.dates = this.cols.map((col) => getDate(col))
  this.datecols = this.cols
  this.locations = this.rows
}

Csv.prototype.getRow = function (rowName) {
  let rowIndex = this.rows.indexOf(rowName) + 1
  if (rowIndex === -1) {
    logger.error('No row with rowName', rowName)
    return null
  }
  return this.papa.data[rowIndex].slice(1)
}

Csv.prototype.getCol = function (colName) {
  let colIndex = this.cols.indexOf(colName)
  if (colIndex === -1) {
    logger.error('No col with colName', colName)
    return null
  }
  return this.papa.data.map(row => row[colIndex + 1]).slice(1)
}

Csv.prototype.getValue = function (rowName, colName) {
  let rowIndex = this.rows.indexOf(rowName) + 1
  let colIndex = this.cols.indexOf(colName) + 1
  if (rowIndex === -1 || colIndex === -1) {
    logger.error('No row/col with ame', rowName, colName)
    return null
  }
  return this.papa.data[rowIndex][colIndex]
}

export { Csv as default }
