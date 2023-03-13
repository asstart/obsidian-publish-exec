import * as E from 'fp-ts/lib/Either.js'
import {pipe} from 'fp-ts/lib/function.js'
import * as path from 'node:path'
import * as util from 'node:util'
import validator from 'validate.js'

import {Log} from './util.js'

const targetRepoInputName = 'targetRepo'
const targetBranchInptName = 'targetBranch'
const targetDefaultBranch = 'targetDefaultBranch'
const targetDirInptName = 'targetFolder'
const sourceDirInputName = 'sourceFolder'
const tagsInputName = 'tags'
const tokenInputName = 'token'
const publishAllInputName = 'publishAll'
const jekyllThemeInputName = 'jekyllTheme'
const jekyllTitleInputName = 'jekyllTitle'
const jekyllDescriptionInputName = 'jekyllDescription'
const colorSchemaInputName = 'colorSchema'
const domainInputName = 'domain'

const targetFolderRoot = new Set(['.', '/'])
const targetFolderDocs = new Set(['/docs', 'docs'])

const sourceRepoDir = 'source'
const targetRepoDirName = 'target'

const defaultCommitMsg = 'publish obsidian'

export interface FS {
  exists(p: string): boolean
}

export interface Input {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getInput(name: string, options?: any | undefined): string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBooleanInput(name: string, options?: any | undefined): boolean
}

export class Parser {
  private fs: FS
  private input: Input
  private log: Log

  constructor(fs: FS, input: Input, log: Log) {
    if (!fs.exists) {
      throw new Error(
        `wrappers.FS must have implementation of [exists(path: string): boolean]for Parser`
      )
    }
    if (!input.getInput || !input.getBooleanInput) {
      throw new Error(
        `wrappers.Input must have implementation of ` +
          `[getInput(name: string, options?: any | undefined): string, ` +
          `getBooleanInput(name: string, options?: any | undefined): boolean] for Parser`
      )
    }
    if (!log.debug) {
      throw new Error(
        `wrappers.Log must have implementation of [debug(msg: string): void] for Parser`
      )
    }
    this.fs = fs
    this.input = input
    this.log = log
  }

  parseInput(): Opts {
    const builder = new OptsBuilder(this.fs, this.log)
    return builder
      .withSourceDir(
        this.input.getInput(sourceDirInputName, {
          required: true,
          trimWhitespace: true
        })
      )
      .withTargetDir(
        this.input.getInput(targetDirInptName, {
          required: true,
          trimWhitespace: true
        })
      )
      .withTags(this.input.getInput(tagsInputName))
      .withPublishAll(this.input.getBooleanInput(publishAllInputName))
      .withTargetRepo(this.input.getInput(targetRepoInputName))
      .withTargetBranch(this.input.getInput(targetBranchInptName))
      .withSourceRepo(process.env.GITHUB_REPOSITORY as string)
      .withAccessToken(this.input.getInput(tokenInputName))
      .withCommitMsg(defaultCommitMsg)
      .withActor(process.env.GITHUB_ACTOR as string)
      .withJekyllTheme(this.input.getInput(jekyllThemeInputName))
      .withJekyllTitle(this.input.getInput(jekyllTitleInputName))
      .withJekyllDescription(this.input.getInput(jekyllDescriptionInputName))
      .withColorSchema(this.input.getInput(colorSchemaInputName))
      .withDomain(this.input.getInput(domainInputName))
      .withRestrictTargetBranch(this.input.getInput(targetDefaultBranch))
      .withRestrictTargetBranch(process.env.GITHUB_REF_NAME as string)
      .build()
  }
}

export class Opts {
  // path to a directory in a source repository relative to root in which files will be searched
  // without trailing /
  sourceDir = ''
  // pathe to a directory in a target repository relative to root in which files will be copied
  // without trailing /
  targetDir = ''
  targetRepoDir = ''
  // tags to filter files
  tags: Set<string> = new Set()
  // if specify, files filtration won't be performed
  publishAll = false
  // repository to push files
  targetRepo = ''
  // repository for which actions started (takes from github.GITHUB_REPOSITORY)
  sourceRepo = ''
  // branch to push filtered files
  targetBranch = ''
  // token to push to target repository
  accessToken = ''
  // commit message
  commitMsg = ''
  // username
  actor = ''

  jekyll_theme?: string
  jekyll_title?: string
  jekyll_description?: string
  jekyll_baseurl?: string

  domain?: string

  color_scheme?: string

  restrictTargetBranches: Set<string> = new Set()
}

const maxPathLength = 4096
// Repo name expects in formae username/reponame
// The most file systems have restrictions on max file name = 255 bytes, so it 255 chars max
// Github username has restriction max 39 chars
const maxRepoNameLength = 39 + 1 + 255
const maxBranchNameLength = 255
const maxCommitMsgLength = 500
const maxThemeNameLength = 100
const maxTitleLength = 500
const maxDescriptionLength = 4000
const maxColorSchemaLength = 20

const constraints = {
  sourceDir: {
    presence: true,
    type: 'string',
    length: {maximum: maxPathLength}
  },
  sourceDirExists: {
    dirExists: {}
  },
  targetDir: {
    presence: true,
    type: 'string',
    length: {maximum: maxPathLength},
    inclusion: {
      within: [...targetFolderRoot, ...targetFolderDocs],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message(value: any) {
        return `${value} doesn't match with any available values: ${util.inspect(
          [...targetFolderDocs, ...targetFolderRoot]
        )}`
      }
    }
  },
  tags: {
    presence: true,
    type: 'string',
    length: {maximum: maxPathLength}
  },
  publishAll: {
    presence: true,
    type: 'boolean'
  },
  targetRepo: {
    presence: true,
    length: {
      minimum: 1,
      maximum: maxRepoNameLength,
      message: lengthValidationMsg(targetRepoInputName)
    },
    format: {
      pattern: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/[\w.@:/~-]{1,255}$/i,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message(value: any) {
        return `targetRepo = ${value} must have format username/reponame`
      }
    }
  },
  targetBranchName: {
    presence: true,
    length: {
      minimum: 1,
      maximum: maxBranchNameLength,
      message: lengthValidationMsg(targetBranchInptName)
    }
  },
  restrictBranchName: {
    presence: true,
    length: {
      minimum: 1,
      maximum: maxBranchNameLength,
      message: lengthValidationMsg('restrictBranchName')
    }
  },
  commitMsg: {
    length: {
      minimum: 1,
      maximum: maxCommitMsgLength,
      message: lengthValidationMsg('commitMsg')
    }
  },
  jekyllTheme: {
    length: {
      maximum: maxThemeNameLength,
      message: lengthValidationMsg(jekyllThemeInputName)
    }
  },
  jekyllTitle: {
    length: {
      maximum: maxTitleLength,
      message: lengthValidationMsg(jekyllTitleInputName)
    }
  },
  jekyllDescription: {
    length: {
      maximum: maxDescriptionLength,
      message: lengthValidationMsg(jekyllDescriptionInputName)
    }
  },
  colorSchema: {
    length: {
      maximum: maxColorSchemaLength,
      message: lengthValidationMsg(colorSchemaInputName)
    }
  },
  domain: {
    domain: {}
  }
}

function lengthValidationMsg(attrname: string): Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value: any, attribute: any, validatorOptions: any) => {
    return (
      `${attrname} = ${value} value length must be between` +
      `[${validatorOptions.minimum ? validatorOptions.minimum : 0},` +
      `${validatorOptions.maximum ? validatorOptions.maximum : ''}]`
    )
  }
}

function parseSingle<I, O>(
  input: I,
  preValidate: (val: I) => E.Either<I, Error>,
  transform: (val: E.Either<I, Error>) => E.Either<O, Error>,
  postValidate: (val: E.Either<O, Error>) => E.Either<O, Error>
): E.Either<O, Error> {
  return pipe(input, preValidate, transform, postValidate)
}

function skip<I>(v: E.Either<I, Error>): E.Either<I, Error> {
  return v
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawValidate<I>(vld: validator.ValidateJS, constr: any) {
  return function (v: I): E.Either<I, Error> {
    const err = vld.single(v, constr)
    return err ? E.right(new Error(err)) : E.left(v)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eitherValidate<I>(vld: any, constraint: any) {
  return function (val: E.Either<I, Error>): E.Either<I, Error> {
    return pipe(
      val,
      E.match(
        (v: I) => {
          return rawValidate<I>(vld, constraint)(v)
        },
        (err: Error) => {
          return E.right(err)
        }
      )
    )
  }
}

function createDirExistsValidator(fs: FS) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (value: any) {
    if (typeof value !== 'string') {
      return `must be string`
    }
    if (!fs.exists(value)) {
      return `${value} doesn't exists`
    }
    // const stat = fs.statSync(value)
    // if (!stat.isDirectory()) {
    //   return `${value} must be directory}`
    // }
    return null
  }
}

function createDomainValidator() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (value: any) {
    if (!value || value === null) {
      return null
    }

    if (typeof value !== 'string') {
      return `${domainInputName} must be a string`
    }

    if (value.endsWith('github.io')) {
      return `only custom domain must be specified in ${domainInputName} param, if *.github.io used, omit this property`
    }

    return null
  }
}

class OptsBuilder {
  private opts: Opts
  private errs: Error[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validator: any
  private log: Log

  constructor(fs: FS, log: Log) {
    this.opts = new Opts()
    this.errs = []
    this.validator = this.getValidator(fs)
    this.log = log
  }

  private getValidator(fs: FS): validator.ValidateJS {
    const v: validator.ValidateJS = validator
    v.validators.dirExists = createDirExistsValidator(fs)
    v.validators.domain = createDomainValidator()
    return v
  }

  withSourceDir(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.sourceDir),
        normalizaSourceDir,
        eitherValidate(this.validator, constraints.sourceDirExists)
      ),
      E.match(
        (v: string) => {
          this.opts.sourceDir = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )
    return this
  }

  withTargetDir(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.targetDir),
        normalizeTargetDir,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.targetDir = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withTags(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.tags),
        normalizaTags,
        skip
      ),
      E.match(
        (v: Set<string>) => {
          this.opts.tags = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  // here execption will be thrown, if input doesn't match with on of: true | True | TRUE | false | False | FALSE
  // need to refactor this, because it's breaking logic of validation other fileds
  withPublishAll(input: boolean): OptsBuilder {
    this.opts.publishAll = input
    return this
  }

  withTargetRepo(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.targetRepo),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.targetRepo = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withSourceRepo(input: string): OptsBuilder {
    this.opts.sourceRepo = input.trim()
    return this
  }

  withTargetBranch(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.targetBranchName),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.targetBranch = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withAccessToken(input: string): OptsBuilder {
    this.opts.accessToken = input
    return this
  }

  withCommitMsg(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.commitMsg),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.commitMsg = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withActor(input: string): OptsBuilder {
    this.opts.actor = input
    return this
  }

  withJekyllTheme(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.jekyllTheme),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.jekyll_theme = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withJekyllTitle(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.jekyllTitle),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.jekyll_title = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withJekyllDescription(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.jekyllDescription),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.jekyll_description = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  withColorSchema(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.colorSchema),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.color_scheme = v
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )
    return this
  }

  withDomain(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.domain),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.domain = encodeURI(v)
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )
    return this
  }

  withRestrictTargetBranch(input: string): OptsBuilder {
    pipe(
      parseSingle(
        input,
        rawValidate(this.validator, constraints.restrictBranchName),
        normalizeString,
        skip
      ),
      E.match(
        (v: string) => {
          this.opts.restrictTargetBranches.add(v)
        },
        (err: Error) => {
          this.errs.push(err)
        }
      )
    )

    return this
  }

  build(): Opts {
    if (!this.opts.publishAll && this.opts.tags.size === 0) {
      this.errs.push(new Error(`if publishAll=false, tags can't be empty`))
    }

    // think about it. maybe it shouldn't be cleaned
    if (this.opts.publishAll) {
      this.opts.tags = new Set<string>()
    }

    if (
      this.opts.sourceRepo === this.opts.targetRepo &&
      this.opts.restrictTargetBranches.has(this.opts.targetBranch)
    ) {
      this.errs.push(
        new Error(
          `if sourceRepo=${this.opts.sourceRepo} matches with targetRepo=${this.opts.targetRepo} ` +
            `targetBranch(${this.opts.targetBranch}) can't be neither default repository branch nor branch ` +
            `in which workflow were ran: (${Array.from(
              this.opts.restrictTargetBranches
            )})`
        )
      )
    }

    if (this.errs.length > 0) {
      throw new Error(this.errs.join('\n'))
    }

    if (!this.opts.domain) {
      this.opts.jekyll_baseurl = `/${this.opts.targetRepo.split('/')[1]}`
    }

    this.opts.targetRepoDir = path.resolve(targetRepoDirName)

    this.log.debug(`run opts: ${util.inspect(this.opts)}`)

    return this.opts
  }
}

function normalizaSourceDir(
  v: E.Either<string, Error>
): E.Either<string, Error> {
  return pipe(
    v,
    E.match(
      (val: string): E.Either<string, Error> => {
        let tmp = val
        if (tmp.startsWith('/')) {
          tmp = tmp.replace(/^\/+/, '')
        }
        tmp = path.resolve(sourceRepoDir, path.normalize(tmp))
        return E.left(tmp)
      },
      (err: Error) => E.right(err)
    )
  )
}

function normalizeTargetDir(
  v: E.Either<string, Error>
): E.Either<string, Error> {
  return pipe(
    v,
    E.match(
      (val: string): E.Either<string, Error> => {
        let tmp = val
        switch (targetFolderRoot.has(tmp)) {
          case true:
            tmp = '.'
            break
          case false:
            tmp = 'docs'
            break
        }

        tmp = path.resolve(targetRepoDirName, tmp)
        return E.left(tmp)
      },
      (err: Error) => E.right(err)
    )
  )
}

function normalizaTags(
  value: E.Either<string, Error>
): E.Either<Set<string>, Error> {
  return pipe(
    value,
    E.match(
      (val: string): E.Either<Set<string>, Error> => {
        const tags = val
          .split(',')
          .map(v => v.trim())
          .filter(v => v.length !== 0)

        return E.left(new Set(tags))
      },
      (err: Error) => E.right(err)
    )
  )
}

function normalizeString(
  value: E.Either<string, Error>
): E.Either<string, Error> {
  return pipe(
    value,
    E.match(
      (val: string): E.Either<string, Error> => {
        const norm = val.trim()
        return E.left(norm)
      },
      (err: Error) => E.right(err)
    )
  )
}
export const private_optsBuilder = OptsBuilder
