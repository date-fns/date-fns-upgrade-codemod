import * as importedFormat from 'date-fns/format'
import closestToIndex from 'date-fns/closest_to_index'
import addSeconds from 'date-fns/add_seconds'
import getThatDay from 'date-fns/get_iso_day'

const dateIs = '2019-07-01'

const format = importedFormat('2019-07-01', 'MM-DD')
const closestIndex = closestToIndex(new Date(2015, 8, 6), [
  new Date(2015, 0, 1),
  new Date(2016, 0, 1),
  new Date(2017, 0, 1)
])
const addSecondsPlease = addSeconds(dateIs, 999)
const isoDay = getThatDay(new Date())
