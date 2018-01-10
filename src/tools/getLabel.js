export default function (labelEntries) {
  if (labelEntries.length === 0) {
    return
  }
  let labelDict = Object.assign(...labelEntries.map(([k, v]) => ({[k]: v})))
  let label = ''
  if ('disease' in labelDict) {
    label += labelDict.disease + ' '
  }
  if ('measure' in labelDict) {
    label += labelDict.measure + ' '
  }
  if ('location' in labelDict) {
    if (label === '') {
      label = labelDict.location + ' '
    }
    else {
      label += 'in ' + labelDict.location + ' '
    }
  }
  if ('status' in labelDict) {
    label += ` (${labelDict.status})`
  }
  label = label.trim()
  label = label.charAt(0).toUpperCase() + label.slice(1)
  return label
}
