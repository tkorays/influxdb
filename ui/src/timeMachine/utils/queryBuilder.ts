import _ from 'lodash'
import {BuilderConfig} from 'src/types'
import {FUNCTIONS} from 'src/timeMachine/constants/queryBuilder'
import {
  TIME_RANGE_START,
  TIME_RANGE_STOP,
  WINDOW_PERIOD,
  OPTION_NAME,
} from 'src/variables/constants'

export function isConfigValid(builderConfig: BuilderConfig): boolean {
  const {buckets, tags} = builderConfig
  const isConfigValid =
    buckets.length >= 1 &&
    tags.length >= 1 &&
    tags.some(({key, values}) => key && values.length > 0)

  return isConfigValid
}

export function buildQuery(builderConfig: BuilderConfig): string {
  const {functions} = builderConfig

  let query: string

  if (functions.length) {
    query = functions.map(f => buildQueryHelper(builderConfig, f)).join('\n\n')
  } else {
    query = buildQueryHelper(builderConfig)
  }

  return query
}

function buildQueryHelper(
  builderConfig: BuilderConfig,
  fn?: BuilderConfig['functions'][0]
): string {
  const [bucket] = builderConfig.buckets
  const tagFilterCall = formatTagFilterCall(builderConfig.tags)
  const fnCall = fn ? formatFunctionCall(fn) : ''

  const query = `from(bucket: "${bucket}")
  |> range(start: ${OPTION_NAME}.${TIME_RANGE_START}, stop: ${OPTION_NAME}.${TIME_RANGE_STOP})${tagFilterCall}${fnCall}`

  return query
}

export function formatFunctionCall(fn: BuilderConfig['functions'][0]) {
  const fnSpec = FUNCTIONS.find(f => f.name === fn.name)

  let fnCall: string = ''

  if (fnSpec && fnSpec.aggregate) {
    fnCall = `
  |> window(period: ${OPTION_NAME}.${WINDOW_PERIOD})
  ${fnSpec.flux}
  |> group(columns: ["_value", "_time", "_start", "_stop"], mode: "except")
  |> yield(name: "${fn.name}")`
  } else {
    fnCall = `
  ${fnSpec.flux}
  |> yield(name: "${fn.name}")`
  }

  return fnCall
}

function formatTagFilterCall(tagsSelections: BuilderConfig['tags']) {
  if (!tagsSelections.length) {
    return ''
  }

  const calls = tagsSelections
    .filter(({key, values}) => key && values.length)
    .map(({key, values}) => {
      const fnBody = values.map(value => `r.${key} == "${value}"`).join(' or ')

      return `|> filter(fn: (r) => ${fnBody})`
    })
    .join('\n  ')

  return `\n  ${calls}`
}

export function hasQueryBeenEdited(
  query: string,
  builderConfig: BuilderConfig
): boolean {
  const emptyQueryChanged = !isConfigValid(builderConfig) && !_.isEmpty(query)
  const existingQueryChanged = query !== buildQuery(builderConfig)

  return emptyQueryChanged || existingQueryChanged
}
