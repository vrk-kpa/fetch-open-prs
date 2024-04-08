/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import { getOctokit } from '@actions/github'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

jest.mock('@actions/github', () => ({
  context: {
    payload: {
      pull_request: {
        number: 1
      }
    },
    repo: {
      owner: 'owner',
      repo: 'repo'
    }
  },
  getOctokit: jest.fn()
}))

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    const mockList = jest.fn()
    mockList.mockImplementation(() => {
      return {
        data: [
          {
            html_url: 'http://example.com',
            title: 'some title',
            user: {
              login: 'some_user'
            },
            created_at: '2024-04-08T03:40:28Z'
          },
          {
            html_url: 'http://example.com',
            title: 'first ignore title',
            user: {
              login: 'first_ignore'
            },
            created_at: '2024-04-08T03:40:28Z'
          },
          {
            html_url: 'http://example.com',
            title: 'second ignore title',
            user: {
              login: 'second_ignore'
            },
            created_at: '2024-04-08T03:40:28Z'
          }
        ]
      }
    })
    const octokitMock = {
      rest: {
        pulls: {
          list: mockList
        }
      }
    }

    ;(getOctokit as jest.Mock).mockReturnValueOnce(octokitMock)
  })

  it('sets the PRs output', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'repository':
          return 'vrk-kpa/fetch-open-prs-action'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'PRs',

      expect.arrayContaining([
        expect.objectContaining({
          url: 'http://example.com',
          title: 'some title',
          user: 'some_user',
          created_at: '2024-04-08T03:40:28Z'
        }),
        expect.objectContaining({
          url: 'http://example.com',
          title: 'first ignore title',
          user: 'first_ignore',
          created_at: '2024-04-08T03:40:28Z'
        }),
        expect.objectContaining({
          url: 'http://example.com',
          title: 'second ignore title',
          user: 'second_ignore',
          created_at: '2024-04-08T03:40:28Z'
        })
      ])
    )

    expect(errorMock).not.toHaveBeenCalled()
  })

  it('Ignored uses are not in the output', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'repository':
          return 'vrk-kpa/fetch-open-prs-action'
        case 'ignored_users':
          return '["first_ignore", "second_ignore"]'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(debugMock).toHaveBeenNthCalledWith(1, 'owner: vrk-kpa')
    expect(debugMock).toHaveBeenNthCalledWith(2, 'repo: fetch-open-prs-action')

    expect(debugMock).toHaveBeenNthCalledWith(3, 'Ignored users length: 2')

    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'PRs',
      expect.not.arrayContaining([
        expect.objectContaining({
          url: 'http://example.com',
          title: 'fist ignore title',
          user: 'first_ignore',
          created_at: '2024-04-08T03:40:28Z'
        }),
        expect.objectContaining({
          url: 'http://example.com',
          title: 'second ignore title',
          user: 'second_ignore',
          created_at: '2024-04-08T03:40:28Z'
        })
      ])
    )
  })

  it('Output should be formatted as markdown', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'repository':
          return 'vrk-kpa/fetch-open-prs-action'
        case 'ignored_users':
          return '["first_ignore", "second_ignore"]'
        case 'format':
          return 'markdown'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'PRs',
      expect.stringContaining('* [some title](http://example.com) by some_user')
    )
  })
})
