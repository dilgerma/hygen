import path from 'path'
import fs from 'fs-extra'
import ejs from 'ejs'
import fm from 'front-matter'
import walk from 'ignore-walk'
import createDebug from 'debug'
import type { RenderedAction, RunnerConfig } from './types'
import context from './context'
const debug = createDebug('hygen:render')

// for some reason lodash/fp takes 90ms to load.
// inline what we use here with the regular lodash.
const map = (f) => (arr) => arr.map(f)
const filter = (f) => (arr) => arr.filter(f)

const ignores = [
  'prompt.js',
  'index.js',
  'prompt.ts',
  'prepare.js',
  'index.ts',
  '.hygenignore',
  'node_modules',
  'package.json',
  '_common',
  '.DS_Store',
  '.Spotlight-V100',
  '.Trashes',
  'ehthumbs.db',
  'Thumbs.db',
]
const renderTemplate = (tmpl, locals, config) =>
  typeof tmpl === 'string' ? ejs.render(tmpl, context(locals, config)) : tmpl

async function getFiles(dir) {
  const files = walk
    .sync({ path: dir, ignoreFiles: ['.hygenignore'] })
    .map((f) => path.join(dir, f))
  return files
}

const render = async (
  args: any,
  config: RunnerConfig,
): Promise<RenderedAction[]> =>
  getFiles(args.actionfolder)
    .then((things) => things.sort((a, b) => a.localeCompare(b))) // TODO: add a test to verify this sort
    .then(filter((f) => !ignores.find((ig) => f.endsWith(ig)))) // TODO: add a
    // test for ignoring prompt.js and index.ejs.js.t
    .then(
      filter((file) => {
          // listing all files in _templates / action folder
          return args.subaction
            ? file.replace(args.actionfolder, '').match(args.subaction)
            : true
        }
      ),
    )
    .then(
      map((file) =>
        fs.readFile(file).then((text) => ({ file, text: text.toString() })),
      ),
    )
    .then((_) => Promise.all(_))
    .then(
      map(({ file, text }) => {
        // formats to {"attributes":{"to":"app/hello.js"},"body":"<%= name%>\n\n\n","bodyBegin":5,"frontmatter":"to: app/hello.js"}
        return { file, ...fm(text, { allowUnsafe: true }) }
      }),
    )
    .then(
      map(({ file, attributes, body }) => {
        // renders the front matter attributes
        //{"to":"app/hello.js"}
        const renderedAttrs = Object.entries(attributes).reduce(
          (obj, [key, value]) => {
            return {
              ...obj,
              [key]: renderTemplate(value, args, config),
            }
          },
          {},
        )
        //TODO - here we render the body - access the attributes
        return {
          file,
          attributes: renderedAttrs,
          body: renderTemplate(
            body,
            { ...args, attributes: renderedAttrs },
            config,
          ),
        }
      }),
    )

export default render
