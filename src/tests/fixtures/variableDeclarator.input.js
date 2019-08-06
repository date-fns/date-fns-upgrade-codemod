const dateFns = require('date-fns')

const dateIs = '2019-07-01'

const formatMePlease = dateFns.format('2019-07-01', 'MM-DD')
const closestIndex = dateFns.closestToIndex(new Date(2015, 8, 6), [
  new Date(2015, 0, 1),
  new Date(2016, 0, 1),
  new Date(2017, 0, 1)
])
const addSeconds = dateFns.addSeconds(dateIs, 999)
