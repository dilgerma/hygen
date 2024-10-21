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

const renderTemplate = (tmpl, locals, config) =>
  typeof tmpl === 'string' ? ejs.render(tmpl, context(locals, config)) : tmpl

const renderFile = async (filePath:string,config:RunnerConfig, variables:{}) => {
    var text = fs.readFileSync(filePath).toString()

  const preformatted = { filePath, ...fm(text, { allowUnsafe: true }) }
  const renderedAttrs = Object.entries(preformatted.attributes).reduce(
    (obj, [key, value]) => {
      return {
        ...obj,
        [key]: renderTemplate(value, variables, config),
      }
    },
    {},
  )
  //TODO - here we render the body - access the attributes
  return {
    filePath,
    attributes: renderedAttrs,
    body: renderTemplate(
      preformatted.body,
      { ...variables, attributes: renderedAttrs },
      config,
    ),
  }
}


export default renderFile
