import {describe, it} from 'mocha'
import * as path from 'node:path'
import {assert, match, spy} from 'sinon'

import {private_optsBuilder} from '../src/input.js'
import {Opts} from '../src/input.js'
import {PublisherDiffRepo, PublisherSameRepo} from '../src/publish.js'
import {silentLogger} from '../src/util.js'

describe('publisher tests', () => {
  it('test git publish to the different repository', async () => {
    const username = 'user'
    const targetRepo = 'user/repo'
    const targetFolder = 'docs'
    const targetBranch = 'gh-pages'
    const token = 'tkn'
    const commitMsg = 'test commit'

    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir(targetFolder)
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo(targetRepo)
      .withTargetBranch(targetBranch)
      .withAccessToken(token)
      .withCommitMsg(commitMsg)
      .withActor(username)
      .build()

    const gitPath = '/git'

    const spyExec = spy((commandLine, args, options) => {
      return Promise.resolve(0)
    })

    const spyIo = spy((tool, check) => {
      if (tool === 'git') {
        return Promise.resolve(gitPath)
      }
      throw new Error('unknow tool: ' + tool)
    })

    const publisher = new PublisherDiffRepo(
      opts,
      {
        exec: spyExec
      },
      {
        which: spyIo
      },
      {
        debug(msg: string) {},
        warn(msg: string) {}
      }
    )
    await publisher.prepare()

    await publisher.publish()

    assert.callCount(spyExec, 9)

    assert.callCount(spyIo, 9)

    assert.calledWith(
      spyExec.getCall(0),
      gitPath,
      ['config', '--global', 'user.name', username],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(1),
      gitPath,
      ['config', '--global', 'user.email', `${username}@noreply`],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(2),
      gitPath,
      [
        'remote',
        'set-url',
        '--push',
        'origin',
        `https://${username}:${token}@github.com/${targetRepo}.git`
      ],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(4),
      gitPath,
      ['checkout', '--orphan', targetBranch],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(5),
      gitPath,
      ['rm', '--ignore-unmatch', '-rf', '.'],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(spyExec.getCall(6), gitPath, ['add', '.'], {
      cwd: path.resolve('target'),
      listeners: {stdout: match.any}
    })

    assert.calledWith(
      spyExec.getCall(7),
      gitPath,
      ['commit', '-m', commitMsg],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(8),
      gitPath,
      ['push', '--force', '-u', 'origin', targetBranch],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    spyExec.restore
    spyIo.restore
  })

  it('test git publish to the same repository', async () => {
    const username = 'user'
    const targetRepo = 'user/repo'
    const targetFolder = 'docs'
    const targetBranch = 'gh-pages'
    const commitMsg = 'test commit'

    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir(targetFolder)
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo(targetRepo)
      .withTargetBranch(targetBranch)
      .withCommitMsg(commitMsg)
      .withActor(username)
      .build()

    const gitPath = '/git'

    const spyExec = spy((commandLine, args, options) => {
      return Promise.resolve(0)
    })

    const spyIo = spy((tool, check) => {
      if (tool === 'git') {
        return Promise.resolve(gitPath)
      }
      throw new Error('unknow tool: ' + tool)
    })

    const publisher = new PublisherSameRepo(
      opts,
      {
        exec: spyExec
      },
      {
        which: spyIo
      },
      {
        debug(msg: string) {},
        warn(msg: string) {}
      }
    )
    await publisher.prepare()

    await publisher.publish()

    assert.callCount(spyExec, 7)

    assert.callCount(spyIo, 7)

    assert.calledWith(
      spyExec.getCall(0),
      gitPath,
      ['config', '--global', 'user.name', username],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(1),
      gitPath,
      ['config', '--global', 'user.email', `${username}@noreply`],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(2),
      gitPath,
      ['checkout', '--orphan', targetBranch],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(3),
      gitPath,
      ['rm', '--ignore-unmatch', '-rf', '.'],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(spyExec.getCall(4), gitPath, ['add', '.'], {
      cwd: path.resolve('target'),
      listeners: {stdout: match.any}
    })

    assert.calledWith(
      spyExec.getCall(5),
      gitPath,
      ['commit', '-m', commitMsg],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    assert.calledWith(
      spyExec.getCall(6),
      gitPath,
      ['push', '--force', '-u', 'origin', targetBranch],
      {
        cwd: path.resolve('target'),
        listeners: {stdout: match.any}
      }
    )

    spyExec.restore
    spyIo.restore
  })
})
