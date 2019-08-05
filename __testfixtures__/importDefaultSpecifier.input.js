import dateFns from 'date-fns'

const dateIs = '2019-07-01'

const formattedDate = dateFns.format('2019-07-01', 'MM-DD')
const closestIndex = dateFns.closestIndexTo(new Date(2015, 8, 6), [
  new Date(2015, 0, 1),
  new Date(2016, 0, 1),
  new Date(2017, 0, 1)
])
const addSeconds = dateFns.addSeconds(dateIs, 999)
