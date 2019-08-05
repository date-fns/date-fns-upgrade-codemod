import { format as importedFormat, closestToIndex, addSeconds } from 'date-fns'

const dateIs = '2019-07-01'

const format = importedFormat('2019-07-01', 'MM-DD')
const closestIndex = closestToIndex(new Date(2015, 8, 6), [
  new Date(2015, 0, 1),
  new Date(2016, 0, 1),
  new Date(2017, 0, 1)
])
const addSecondsPlease = addSeconds(dateIs, 999)
