import * as importedFormat from 'date-fns/format'
import closestToIndex from 'date-fns/closestToIndex'
import addSeconds from 'date-fns/addSeconds'

const dateIs = '2019-07-01'

const formattedDate = importedFormat(
  legacyParse('2019-07-01'),
  convertTokens('MM-DD')
)
const closestIndex = closestToIndex(
  legacyParse(new Date(2015, 8, 6)),
  legacyParseMap([
    new Date(2015, 0, 1),
    new Date(2016, 0, 1),
    new Date(2017, 0, 1)
  ])
)
const addSecondsPlease = addSeconds(legacyParse(dateIs), 999)
