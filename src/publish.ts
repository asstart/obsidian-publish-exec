import {Opts} from './input.js'
import {Log} from './util.js'

export interface Exec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exec(commandLine: string, args?: string[], options?: any): Promise<number>
}

export interface IO {
  which(tool: string, check?: boolean): Promise<string>
}

abstract class GitPublisher {
  protected log: Log
  protected exec: Exec
  protected opts: Opts
  protected io: IO

  constructor(opts: Opts, exec: Exec, io: IO, log: Log) {
    this.opts = opts
    this.exec = exec
    this.io = io
    this.log = log
  }

  protected async execGit(args: string[]): Promise<number> {
    const defaultListener = {
      stdout: (data: Buffer) => {
        stdout.push(data.toString())
      }
    }

    const stdout: string[] = []
    const options = {
      cwd: this.opts.targetRepoDir,
      listeners: defaultListener
    }

    const gitPath = await this.io.which('git')
    const exitCode = await this.exec.exec(gitPath, args, options)
    const out = stdout.join('')

    this.log.debug(exitCode.toString())
    this.log.debug(out)

    return exitCode
  }
}

export class PublisherSameRepo extends GitPublisher {
  async prepare(): Promise<void> {
    await this.configureUser()
    // await this.configureRemote()
    await this.prepareBranch()
    await this.cleanup()
  }

  async publish(): Promise<void> {
    await this.commit()
    await this.push()
  }

  private async configureUser(): Promise<void> {
    await this.execGit(['config', '--global', 'user.name', this.opts.actor])
    await this.execGit([
      'config',
      '--global',
      'user.email',
      `${this.opts.actor}@noreply`
    ])
  }

  private async configureRemote(): Promise<void> {
    const remote = await this.getRemoteUrl(this.opts)
    await this.execGit(['remote', 'set-url', '--push', 'origin', remote])
  }

  private async getRemoteUrl(opts: Opts): Promise<string> {
    return this.getGithubTokenRemote(opts)
  }

  private async getGithubTokenRemote(opts: Opts): Promise<string> {
    return `https://github.com/${opts.targetRepo}.git`
  }

  private async prepareBranch(): Promise<void> {
    await this.execGit(['checkout', '--orphan', this.opts.targetBranch])
  }

  private async cleanup(): Promise<void> {
    await this.execGit(['rm', '--ignore-unmatch', '-rf', '.'])
  }

  private async commit(): Promise<void> {
    await this.execGit(['add', '.'])
    await this.execGit(['commit', '-m', this.opts.commitMsg])
  }

  private async push(): Promise<void> {
    // test is force push really need here?
    await this.execGit([
      'push',
      '--force',
      '-u',
      'origin',
      this.opts.targetBranch
    ])
  }
}

export class PublisherDiffRepo extends GitPublisher {
  async prepare(): Promise<void> {
    await this.configureUser()
    await this.configureRemote()
    await this.removeAuthHeader()
    await this.prepareBranch()
    await this.cleanup()
  }

  async publish(): Promise<void> {
    await this.commit()
    await this.push()
  }

  private async configureUser(): Promise<void> {
    await this.execGit(['config', '--global', 'user.name', this.opts.actor])
    await this.execGit([
      'config',
      '--global',
      'user.email',
      `${this.opts.actor}@noreply`
    ])
  }

  private async configureRemote(): Promise<void> {
    const remote = await this.getRemoteUrl(this.opts)
    await this.execGit(['remote', 'set-url', '--push', 'origin', remote])
  }

  private async getRemoteUrl(opts: Opts): Promise<string> {
    return this.getGithubTokenRemote(opts)
  }

  private async getGithubTokenRemote(opts: Opts): Promise<string> {
    return `https://${opts.actor}:${opts.accessToken}@github.com/${opts.targetRepo}.git`
  }

  private async prepareBranch(): Promise<void> {
    await this.execGit(['checkout', '--orphan', this.opts.targetBranch])
  }

  private async cleanup(): Promise<void> {
    await this.execGit(['rm', '--ignore-unmatch', '-rf', '.'])
  }

  private async commit(): Promise<void> {
    await this.execGit(['add', '.'])
    await this.execGit(['commit', '-m', this.opts.commitMsg])
  }

  private async push(): Promise<void> {
    // test is force push really need here?
    await this.execGit([
      'push',
      '--force',
      '-u',
      'origin',
      this.opts.targetBranch
    ])
  }

  // need to research, can this be avoided? rewrite if not
  // what if commit to the same repo that contains source
  private async removeAuthHeader(): Promise<void> {
    const gitPath = await this.io.which('git')
    await this.exec.exec(
      //`/bin/bash -c "${gitPath} config -l | grep 'http\..*\.extraheader' | cut -d= -f1 | xargs -L1 git config --unset-all"`
      `/bin/bash -c "${gitPath} config -l | grep 'http..*.extraheader' | cut -d= -f1 | xargs -L1 git config --unset-all"`,
      [],
      {cwd: this.opts.targetRepoDir}
    )
  }
}
