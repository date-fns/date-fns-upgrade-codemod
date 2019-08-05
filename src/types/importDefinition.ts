import { NodePath } from 'ast-types'

export type ImportDefinition = {
  variableName?: string
  source?: string
  importedExport: {
    name: string
    isImportedAsCJS: boolean
  }
  kind: 'value' | 'type' | 'typeof'
  isDynamicImport: boolean
  path: NodePath

  remove(): void
  fork?(options: { insert?: 'before' | 'after' }): void
}
