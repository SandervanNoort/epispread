export default function (name, index) {
  let components = []
  let root = window.vm
  addChildren(root, components, name)
  if (components.lenght === 0) {
    return null
  }
  if (components.length === 1) {
    return components[0]
  }
  if (index === undefined) {
    return components
  }
  if (index < components.length - 1) {
    return components[index]
  }
  else {
    return components[0]
  }
}

function addChildren (root, components, name) {
  for (let child of root.$children) {
    addChildren(child, components, name)
    if (child.$options.name && child.$options.name.match(name)) {
      components.push(child)
    }
  }
}
