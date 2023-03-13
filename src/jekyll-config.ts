import {Either, match} from 'fp-ts/lib/Either.js'
import {pipe} from 'fp-ts/lib/function.js'
import path from 'node:path'
import * as util from 'node:util'
import * as yml from 'yaml'

import {Opts} from './input.js'
import {conditionJTD as conditionJTDConf, initJTDConf} from './jtd.js'
import {Log} from './util.js'

const defaultTheme = 'just-the-docs'

const noPlugingThemes = new Set(['minima'])

const remoteThemePlugin = 'jekyll-remote-theme'
const themeSpelling = new Map<string, string>([
  ['just-the-docs', 'asstart/just-the-docs'],
  ['asstart/just-the-docs', 'asstart/just-the-docs']
])

const defaultPlugins = ['jekyll-seo-tag']

type Condition = (conf: JekyllConf) => boolean
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Initialization = (conf: JekyllConf, opt: Opts) => Either<any, Error>
// it's better to move all binding to main, to have all of them in one place
const dependepntConfigsMapping = new Map<Condition, Initialization>([
  [conditionJTDConf, initJTDConf]
])

// checking if theme finished with version in right format
// re for semver: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const fullThemeNameRe =
  /^pages-themes\/[\w-]+@v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export interface ConfWriter {
  /**
   * Synchronously writes `string` to the file referenced by the supplied file descriptor, returning the number of bytes written.
   * @param fd A file descriptor.
   * @param string A string to write.
   */
  write(fd: number, string: string): number
  /**
   * Returns an integer representing the file descriptor.
   *
   * @param [flags='r']
   * @param [mode=0o666]
   */
  open(
    filepath: string,
    flags: string | number,
    mode?: string | number | null
  ): number

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mkdir(p: string, options: any): string | undefined
}

export class JekyllConfCreator {
  conf: JekyllConf
  private writer: ConfWriter
  private confPath: string
  private log: Log

  constructor(opts: Opts, writer: ConfWriter, log: Log) {
    this.log = log
    this.conf = new JekyllConfBuilder(log)
      .withTheme(opts.jekyll_theme)
      .withTitle(opts.jekyll_title)
      .withDescription(opts.jekyll_description)
      .withBaseUrl(opts.jekyll_baseurl)
      .withDomain(opts.domain)
      .build(opts)

    this.confPath = this.filePath(opts)
    this.writer = writer
  }

  saveJekyllConfig(): void {
    const ymlStr = this.conf.stringify()
    this.log.debug(`generated _config.yml content: ${util.inspect(ymlStr)}`)

    this.log.debug(`_config.yml will be created at: ${this.confPath}`)
    this.writer.mkdir(path.dirname(this.confPath), {recursive: true})
    this.writer.write(this.writer.open(this.confPath, 'w'), ymlStr)
  }

  private filePath(opts: Opts): string {
    return path.resolve(opts.targetDir, '_config.yml')
  }
}

export class JekyllConf {
  theme: string | undefined
  plugins: string[] = [...defaultPlugins]
  title?: string | undefined
  description?: string | undefined
  remote_theme?: string | undefined
  baseurl?: string | undefined
  domain?: string | undefined
  // Set of configs, that will be created
  // only if certain conditions exist
  // e.g. specific set of configs for theme
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependentConfigs: any[] = []

  // don't like this implementation
  stringify(): string {
    console.log(util.inspect(this))
    const doc = new yml.Document({})

    if (this.theme) {
      doc.add({key: 'theme', value: this.theme})
    }
    if (this.plugins) {
      doc.add({key: 'plugins', value: this.plugins})
    }
    if (this.title) {
      doc.add({key: 'title', value: this.title})
    }
    if (this.description) {
      doc.add({key: 'description', value: this.description})
    }
    if (this.remote_theme) {
      doc.add({key: 'remote_theme', value: this.remote_theme})
    }
    if (this.baseurl) {
      doc.add({key: 'baseurl', value: this.baseurl})
    }
    if (this.domain) {
      doc.add({key: 'domain', value: this.domain})
    }
    for (const [k, v] of Object.entries(this.dependentConfigs[0])) {
      doc.add({key: k, value: v})
    }
    return yml.stringify(doc, {lineWidth: 0})
  }
}

class JekyllConfBuilder {
  private conf: JekyllConf
  private log: Log

  constructor(log: Log) {
    this.conf = new JekyllConf()
    this.log = log
  }

  withTheme(theme: string | undefined): JekyllConfBuilder {
    const currTheme = theme ? theme : defaultTheme
    let fullThemeName: string | undefined = themeSpelling.get(currTheme)

    // if full theme name wasn't be resolved by theme dictionary
    // it's expected to be full theme name including version (pages-themes/cayman@v0.2.0)
    // in this case checking if it's one of predefined themes then this name will be used
    // without modyfing
    if (!fullThemeName) {
      for (const k of themeSpelling.keys()) {
        if (currTheme.startsWith(k) && fullThemeNameRe.exec(currTheme)) {
          fullThemeName = currTheme
          break
        }
      }
    }

    // if full theme name still hasn't resolved - failing build
    // it's better to acknowledge user that configuration is wrong
    // instead failing back to default theme
    if (!fullThemeName) {
      const msg = `theme name ${theme} couldn't be resolved,
       theme could be defined either by name from the following list ${util.inspect(
         themeSpelling.keys()
       )}
       or
       by its full name including version, like this "pages-themes/cayman@v0.2.0"
       but it's still should be a theme from the list above`
      this.log.debug(msg)
      throw new Error(msg)
    }

    if (!noPlugingThemes.has(fullThemeName)) {
      this.conf.plugins.push(remoteThemePlugin)
      this.conf.remote_theme = fullThemeName
    } else {
      this.conf.theme = fullThemeName
    }

    return this
  }

  withTitle(title?: string): JekyllConfBuilder {
    if (!title) {
      return this
    }
    this.conf.title = title
    return this
  }

  withDescription(description?: string): JekyllConfBuilder {
    if (!description) {
      return this
    }
    this.conf.description = description
    return this
  }

  withDomain(domain?: string): JekyllConfBuilder {
    if (!domain) {
      return this
    }
    this.conf.domain = domain
    return this
  }

  // for sites hosted under <username>.github.io baseurl always will be projectname
  // need to check hosting under personal domain, in this case baseurl probably
  // should be configured in another way or even can be omitted
  withBaseUrl(baseUrl?: string): JekyllConfBuilder {
    if (!baseUrl) {
      return this
    }
    this.conf.baseurl = baseUrl
    return this
  }

  build(opts: Opts): JekyllConf {
    for (const [condition, initialize] of dependepntConfigsMapping) {
      if (condition(this.conf)) {
        pipe(
          initialize(this.conf, opts),
          match(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (v: any) => this.conf.dependentConfigs.push(v),
            (err: Error) => {
              const msg = `error on initializing dependent conf: ${err}`
              this.log.debug(msg)
              // not better solution to just throw this
              throw err
            }
          )
        )
      }
    }

    return this.conf
  }
}
