import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const octokit = github.getOctokit(token)

    const repo = core.getInput('repository')
    const [owner, repository] = repo.split('/')


    const prList = await octokit.rest.pulls.list({
      owner: owner,
      repo: repo
    })

    core.setOutput('PRs', prList)

  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
