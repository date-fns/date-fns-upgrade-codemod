import { JSDocInterface } from './JSDocInterface'

const fs = require('fs')
const path = require('path')
const jsDocData = require('./JSDoc.json') as JSDocInterface

type FunctionHasDate = {
  hasDate: boolean
  hasArrayDate: boolean
  convertTokens?: boolean
}

export type CodeMap = {
  [functionName: string]: FunctionHasDate[]
}

const codeMap: CodeMap = {}

Object.values(jsDocData).forEach(value =>
  value.forEach(({ title, args }) => {
    codeMap[title] = args.reduce<FunctionHasDate[]>(
      (prevValue, { type: { names } }) => {
        prevValue.push({
          hasDate: names.includes('Date') || names.includes('*'),
          hasArrayDate: names.includes('Array.<Date>')
        })

        return prevValue
      },
      []
    )
  })
)

fs.writeFile(
  path.join(__dirname, '..', '..', 'data', 'functionData.json'),
  JSON.stringify(codeMap),
  function(err: NodeJS.ErrnoException | null) {
    if (err) {
      return console.log(err)
    }

    console.log('The file was saved!')
  }
)
