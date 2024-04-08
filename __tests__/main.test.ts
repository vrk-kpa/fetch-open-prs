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
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    const mockList = jest.fn()
    mockList.mockImplementation(() => {
      return [
        {
          url: 'http://example.com'
        }
      ]
    })
    let octokitMock = {
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
          return 'vrk/kpa/fetch-open-prs-action'
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
        {
          url: 'http://example.com'
        }
      ])
    )

    expect(errorMock).not.toHaveBeenCalled()
  })
})
