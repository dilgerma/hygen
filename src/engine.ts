import fs from 'fs-extra'
import type { ActionResult, RunnerConfig } from './types'
import params from './params'
import { ConfigResolver } from './config'
import path from 'path'
import { json } from 'node:stream/consumers'
import helpers from './helpers'

class ShowHelpError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, ShowHelpError.prototype)
  }
}

const engine = async (
  argv: string[],
  config: RunnerConfig,
): Promise<ActionResult[]> => {


  const { cwd, templates, logger } = config

  let configJsonResolver = new ConfigResolver('config.json', {
    exists: fs.exists,
    load: async (f) => await import(f),
    none: (_) => ({}),
  })
  let configJson = await configJsonResolver.resolve(cwd)
  const args = Object.assign(await params(config, argv, configJson), { cwd })
  const { generator, action, actionfolder } = args

  if (['-h', '--help'].includes(argv[0])) {
    logger.log(`
Usage:
  hygen [option] GENERATOR ACTION [--name NAME] [data-options]

Options:
  -h, --help # Show this message and quit
  --dry      # Perform a dry run.  Files will be generated but not saved.`)
    process.exit(0)
  }

  logger.log(args.dry ? '(dry mode)' : '')
  if (!generator) {
    throw new ShowHelpError('please specify a generator.')
  }

  if (!action) {
    throw new ShowHelpError(`please specify an action for ${generator}.`)
  }

  logger.log(`Loaded templates: ${templates.replace(`${cwd}/`, '')}`)
  if (!(await fs.exists(actionfolder))) {
    throw new ShowHelpError(`I can't find action '${action}' for generator '${generator}'.

      You can try:
      1. 'hygen init self' to initialize your project, and
      2. 'hygen generator new --name ${generator}' to build the generator you wanted.

      Check out the quickstart for more: https://hygen.io/docs/quick-start
      `)
  }

  // lazy loading these dependencies gives a better feel once
  // a user is exploring hygen (not specifying what to execute)
  const execute = (await import('./execute')).default
  const render = (await import('./render')).default

  const hooksfile = path.resolve(path.join(args.actionfolder, 'index.js'))
  //@ts-ignore
  if (fs.existsSync(hooksfile)) {
    let hooksModule = await import(hooksfile)
    if (hooksModule.default) {
      hooksModule = hooksModule.default
    }

    if (hooksModule.render) {
      const renderFile = (await import('./renderFile')).default
      //@ts-ignore
       return execute(await hooksModule.render(args.actionfolder, args, configJson, config, renderFile), args, config)
    } else {
      return execute(await render(args, config), args, config)

    }
  } else {
    return execute(await render(args, config), args, config)
  }


}

export { ShowHelpError }
export default engine
