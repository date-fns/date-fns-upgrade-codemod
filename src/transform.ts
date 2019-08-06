import { camelCase } from 'change-case'

import { API, FileInfo } from 'jscodeshift/src/core'
import { ImportDefinition } from './types/importDefinition'
import { CodeMap } from './utils/parse'
import { ExpressionKind, SpreadElementKind } from 'ast-types/gen/kinds'
import {
  CallExpression,
  Identifier,
  MemberExpression,
  ImportDeclaration,
  VariableDeclarator,
  VariableDeclaration
} from 'ast-types/gen/nodes'
import { Collection } from 'jscodeshift/src/Collection'

const transformImports = require('transform-imports')
const functionData = require('./data/functionData.json') as CodeMap

type ImportSpecifier =
  | {
      importedName: string
      importType: 'default'
    }
  | {
      libraryName: string
      importedName: string
      importType: 'named' | 'module'
    }

const lastPath = (
  c: Collection<ImportDeclaration> | Collection<VariableDeclaration>
) => c.at(-1).paths()[0]

const dateFnsCodemod = (fileInfo: FileInfo, api: API) => {
  const j = api.jscodeshift.withParser('babylon')

  const importSpecifiers: ImportSpecifier[] = []

  const usedImportTypes = {
    default: false,
    named: false,
    module: false
  }

  const usedLegacyArguments: { [key: string]: boolean } = {
    legacyParse: false,
    legacyParseMap: false,
    convertTokens: false
  }

  const usedLegacyArgumentsKeys = Object.keys(usedLegacyArguments)

  const codeWithTransformedImports = transformImports(
    fileInfo.source,
    (importDefs: ImportDefinition[]) => {
      importDefs
        .filter(({ source }) => (source || '').includes('date-fns'))
        .filter(({ variableName }) => variableName !== undefined)
        .forEach(importDef => {
          const source = importDef.source!
          const importedExportName = importDef.importedExport.name

          const isImportNameDefault =
            importedExportName === 'default' || importedExportName === '*'
          const isImportingFromModule = importDef.source!.includes('/')

          const isDefaultImport = isImportNameDefault && !isImportingFromModule
          const isNamedImport = !isImportNameDefault && !isImportingFromModule
          const isModuleImport = isImportNameDefault && isImportingFromModule

          if (isDefaultImport) {
            importSpecifiers.push({
              importedName: importDef.variableName!,
              importType: 'default'
            })

            usedImportTypes.default = true
          } else if (isNamedImport) {
            importSpecifiers.push({
              importedName: importDef.variableName!,
              libraryName: importedExportName,
              importType: 'named'
            })

            usedImportTypes.named = true
          } else if (isModuleImport) {
            const libraryName = camelCase(source.split('/')[1]).replace(
              /iso/gi,
              'ISO'
            )

            importSpecifiers.push({
              importedName: importDef.variableName!,
              libraryName: libraryName,
              importType: 'module'
            })

            usedImportTypes.module = true
            importDef.source = `date-fns/${libraryName}`
          }
        })
    }
  )

  const root = j(codeWithTransformedImports)

  const rewriteArguments = (libraryName: string) => (
    argumentNode: ExpressionKind | SpreadElementKind,
    argumentIndex: number
  ) => {
    const functionCallData = functionData[libraryName]

    if (!functionCallData) return argumentNode

    for (let key of usedLegacyArgumentsKeys) {
      if (functionCallData[argumentIndex][key]) {
        usedLegacyArguments[key] = true

        return j.callExpression(j.identifier(key), [argumentNode])
      }
    }

    return argumentNode
  }

  const processDefaultImport = (importedName: string) => {
    root
      .find<CallExpression>(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: {
            name: importedName
          }
        }
      })
      .replaceWith<CallExpression>(({ node }) => {
        const memberName = ((node.callee as MemberExpression)
          .property as Identifier).name

        return j.callExpression(
          j.memberExpression(
            j.identifier(importedName),
            j.identifier(
              ((node.callee as MemberExpression).property as Identifier).name
            )
          ),
          node.arguments.map(rewriteArguments(memberName))
        )
      })
  }

  const processNamedImport = (importedName: string, libraryName: string) => {
    root
      .find<CallExpression>(j.CallExpression, {
        callee: {
          type: 'Identifier',
          name: importedName
        }
      })
      .replaceWith(({ node }) =>
        j.callExpression(
          j.identifier(importedName),
          node.arguments.map(rewriteArguments(libraryName))
        )
      )
  }

  importSpecifiers.forEach(importSpecifier => {
    switch (importSpecifier.importType) {
      case 'default':
        processDefaultImport(importSpecifier.importedName)
        break
      case 'named':
      case 'module':
        processNamedImport(
          importSpecifier.importedName,
          importSpecifier.libraryName
        )
        break
    }
  })

  const usedLegacyArgumentsEntries = Object.entries(usedLegacyArguments).filter(
    ([_, value]) => value
  )

  const onlyModuleImportUsed = !(
    usedImportTypes.default || usedImportTypes.named
  )

  if (usedLegacyArgumentsEntries.length > 0 && !onlyModuleImportUsed) {
    const legacyTools = usedLegacyArgumentsEntries.reduce<string[]>(
      (accum, [key]) => {
        accum.push(key)
        return accum
      },
      []
    )

    const allImports = root.find<ImportDeclaration>(j.ImportDeclaration)

    if (allImports.size()) {
      lastPath(allImports).insertAfter(
        j.importDeclaration(
          legacyTools.map(value => j.importSpecifier(j.identifier(value))),
          j.stringLiteral('date-fns-upgrade')
        )
      )
    }

    const variableDeclarationCollection = root.find<VariableDeclaration>(
      j.VariableDeclaration,
      {
        declarations: [
          {
            type: 'VariableDeclarator',
            init: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'require'
              }
            }
          }
        ]
      }
    )

    if (variableDeclarationCollection.size()) {
      lastPath(variableDeclarationCollection).insertAfter(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.objectPattern(
              legacyTools.map(value => {
                const identifier = j.identifier(value)
                return j.property.from({
                  kind: 'init',
                  key: identifier,
                  value: identifier,
                  shorthand: true
                })
              })
            ),
            j.callExpression(j.identifier('require'), [
              j.literal('date-fns-upgrade')
            ])
          )
        ])
      )
    }
  }

  return root.toSource()
}

module.exports = dateFnsCodemod
