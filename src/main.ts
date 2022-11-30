import * as core from '@actions/core'
import * as github from '@actions/github'
import {Minimatch} from 'minimatch'
import {getLabel} from './config'
import {ConfigEntry} from './ConfigEntry'

const CONFIG_FILENAME = 'pr-branch-labeler.yml'
const defaults: ConfigEntry[] = [
  {label: 'feature', head: 'feature/*', base: undefined},
  {label: 'bugfix', head: ['bugfix/*', 'hotfix/*'], base: undefined},
  {label: 'chore', head: 'chore/*', base: undefined}
]

// Export the context to be able to mock the payload during tests.
export const context = github.context

export async function run() {
  const repoToken: string = core.getInput('repo-token', {required: true})

  core.debug(`context: ${context ? JSON.stringify(context) : ''}`)

  if (
    context &&
    context.payload &&
    context.payload.repository &&
    context.payload.pull_request
  ) {
    const octokit = github.getOctokit(repoToken)
    const repoConfig: ConfigEntry[] = await getLabel(
      octokit,
      CONFIG_FILENAME,
      context
    )
    core.debug(`repoConfig: ${JSON.stringify(repoConfig)}`)
    const config: ConfigEntry[] = repoConfig.length > 0 ? repoConfig : defaults
    core.debug(`config: ${JSON.stringify(config)}`)
    const headRef = context.payload.pull_request.head.ref
    const baseRef = context.payload.pull_request.base.ref
    const labelsToAdd = config.reduce((labels: string[], entry) => {
      if (entry.head && entry.base) {
        if (checkAny(headRef, entry.head) && checkAny(baseRef, entry.base)) {
          core.info(
            `Matched "${headRef}" to "${entry.head}" and "${baseRef}" to "${entry.base}". Setting label to "${entry.label}"`
          )
          labels.push(entry.label)
        }
      } else if (entry.head && checkAny(headRef, entry.head)) {
        core.info(
          `Matched "${headRef}" to "${entry.head}". Setting label to "${entry.label}"`
        )
        labels.push(entry.label)
      } else if (entry.base && checkAny(baseRef, entry.base)) {
        core.info(
          `Matched "${baseRef}" to "${entry.base}". Setting label to "${entry.label}"`
        )
        labels.push(entry.label)
      }

      return labels
    }, [])

    if (labelsToAdd.length > 0) {
      core.debug(`Adding labels: ${labelsToAdd}`)
      await octokit.rest.issues.addLabels({
        issue_number: context.payload.pull_request.number,
        labels: labelsToAdd,
        ...context.repo
      })
    }
  }
}

function isMatch(ref: string, pattern: string): boolean {
  const matcher = new Minimatch(pattern)
  return matcher.match(ref)
}

function checkAny(ref: string, patterns: string | string[]): boolean {
  return Array.isArray(patterns)
    ? patterns.some((pattern: string) => isMatch(ref, pattern))
    : isMatch(ref, patterns)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

try {
  run()
} catch (error: unknown) {
  core.error(`ERROR! ${JSON.stringify(error)}`)
  core.setFailed(getErrorMessage(error))
  throw error
}
