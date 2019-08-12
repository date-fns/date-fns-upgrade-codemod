import * as importedFormat from 'date-fns/format'
import closestToIndex from 'date-fns/closestToIndex'
import addSeconds from 'date-fns/addSeconds'
import getThatDay from 'date-fns/getISODay'

import { legacyParse, legacyParseMap, convertTokens } from 'date-fns-upgrade'

const dateIs = '2019-07-01'

const someToken = 'MM-DD';
const format = importedFormat(
  legacyParse('2019-07-01'),
  convertTokens(someToken)
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
const isoDay = getThatDay(legacyParse(new Date()))
