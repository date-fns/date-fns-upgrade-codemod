export interface Names {
  names: string[]
}

export interface Param {
  type: Names
  description: string
  name: string
  optional?: boolean
  defaultvalue: any
  variable?: boolean
}

export interface Return {
  type: Names
  description: string
}

export interface Exception {
  type: Names
  description: string
}

export interface Meta {
  lineno: number
  filename: string
  path: string
}

export interface Content {
  id: string
  longname: string
  name: string
  scope: string
  kind: string
  description: string
  params: Param[]
  examples: string[]
  returns: Return[]
  category: string
  exceptions: Exception[]
  meta: Meta
  summary: string
  order: number
}

export interface Prop {
  type: Names
  optional: boolean
  defaultvalue: any
  description: string
  name: string
  isProperty: boolean
}

export interface Arg {
  type: Names
  description: string
  name: string
  optional?: boolean
  props: Prop[]
  defaultvalue: string
  variable?: boolean
}

export interface UsageExample {
  title: string
  code: string
}

export interface Usage {
  commonjs: UsageExample
  umd: UsageExample
  es2015: UsageExample
}

export interface CommonHelper {
  type: string
  urlId: string
  category: string
  title: string
  description: string
  content: Content
  args: Arg[]
  usage: Usage
  usageTabs: string[]
  syntax: string
}

export interface JSDocInterface {
  [key: string]: CommonHelper[]
  'Common Helper': CommonHelper[]
  'Range Helper': CommonHelper[]
  'Timestamp Helper': CommonHelper[]
  'Millisecond Helper': CommonHelper[]
  'Second Helpers': CommonHelper[]
  'Minute Helper': CommonHelper[]
  'Hour Helper': CommonHelper[]
  'Day Helper': CommonHelper[]
  'Weekday Helper': CommonHelper[]
  'Week Helper': CommonHelper[]
  'ISO Week Helper': CommonHelper[]
  'Month Helper': CommonHelper[]
  'Quarter Helper': CommonHelper[]
  'Year Helper': CommonHelper[]
  'ISO Week-Numbering Year Helper': CommonHelper[]
}
