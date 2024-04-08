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

    const repository = core.getInput('repository')
    const [owner, repo] = repository.split('/')

    const prList = await octokit.rest.pulls.list({
      owner,
      repo
    })

    const parsedPrList: {
      url: string
      title: string
      user: string
      created_at: string
    }[] = []

    prList.data.forEach(pr => {
      let parsedPr = {
        url: pr['html_url'],
        title: pr['title'],
        user: '',
        created_at: pr['created_at']
      }

      if (pr['user']) {
        parsedPr['user'] = pr['user']['login']
      }

      parsedPrList.push(parsedPr)
    })

    core.setOutput('PRs', parsedPrList)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
