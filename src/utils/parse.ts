import { JSDocInterface } from '../types'
const fs = require('fs')
const path = require('path')
const jsDocData = require('./JSDoc.json') as JSDocInterface

enum LegacyFunctionTypes {
  legacyParse = 'legacyParse',
  legacyParseMap = 'legacyParseMap',
  convertTokens = 'convertTokens'
}

export type CodeMap = {
  [functionName: string]: LegacyFunctionTypes[]
}

const codeMap: CodeMap = {}

Object.values(jsDocData).forEach(value =>
  value.forEach(({ title, args }) => {
    codeMap[title] = args.reduce<LegacyFunctionTypes[]>(
      (prevValue, { type: { names } }, argIndex) => {
        if (title === 'format' && argIndex === 1) {
          prevValue.push(LegacyFunctionTypes.convertTokens)
        } else if (names.includes('Array.<Date>')) {
          prevValue.push(LegacyFunctionTypes.legacyParseMap)
        } else if (names.includes('Date') || names.includes('*')) {
          prevValue.push(LegacyFunctionTypes.legacyParse)
        } else {
          prevValue.push()
        }

        return prevValue
      },
      []
    )
  })
)

fs.writeFile(
  path.join(__dirname, '..', 'data', 'functionData.json'),
  JSON.stringify(codeMap),
  function(err: NodeJS.ErrnoException | null) {
    if (err) {
      return console.log(err)
    }

    console.log('The file was saved!')
  }
)
