import * as github from '@actions/github'
import * as Context from '@actions/github/lib/context'
import yaml from 'js-yaml'
import {ConfigEntry} from './ConfigEntry'
const CONFIG_PATH = '.github'

type ClientType = ReturnType<typeof github.getOctokit>

async function fetchContent(
  client: ClientType,
  repoPath: string,
  context: Context.Context
): Promise<string> {
  const response: any = await client.rest.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: CONFIG_PATH + repoPath,
    ref: context.sha
  })

  return Buffer.from(response.data.content, response.data.encoding).toString()
}

export async function getLabel(
  client: ClientType,
  configurationPath: string,
  context: Context.Context
): Promise<ConfigEntry[]> {
  const configurationContent: string = await fetchContent(
    client,
    configurationPath,
    context
  )

  // loads (hopefully) a `{[label:string]: string | StringOrMatchConfig[]}`, but is `any`:
  const configObject = yaml.load(configurationContent)

  // transform `any` => `Map<string,StringOrMatchConfig[]>` or throw if yaml is malformed:
  return parseConfig(configObject as string)
}

function parseConfig(content: string): ConfigEntry[] {
  return Object.entries(content).reduce(
    (entries: ConfigEntry[], [label, object]: [string, any]) => {
      const headPattern =
        object.head ||
        (typeof object === 'string' || Array.isArray(object)
          ? object
          : undefined)
      const basePattern = object.base
      if (headPattern || basePattern) {
        entries.push({label, head: headPattern, base: basePattern})
      } else {
        throw new Error('config.yml has invalid structure.')
      }

      return entries
    },
    []
  )
}
