export default function (array, keys) {
  let val = keys.reduce(function (subArray, key) {
    return subArray ? subArray[key] : undefined
  }, array)
  return val
}
