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

    core.debug(`owner: ${owner}`)
    core.debug(`repo: ${repo}`)

    const prList = await octokit.rest.pulls.list({
      owner,
      repo
    })

    const ignored_users = core.getInput('ignored_users')

    let ignored_users_list = []
    if (ignored_users) {
      ignored_users_list = JSON.parse(ignored_users)
      core.debug(`Ignored users length: ${ignored_users_list.length}`)
    }

    const parsedPrList: {
      url: string
      title: string
      user: string
      created_at: string
    }[] = []

    for (const pr of prList.data) {
      const parsedPr = {
        url: pr['html_url'],
        title: pr['title'],
        user: '',
        created_at: pr['created_at']
      }

      if (pr['user'] && !ignored_users_list.includes(pr['user']['login'])) {
        parsedPr['user'] = pr['user']['login']
      }

      parsedPrList.push(parsedPr)
    }

    core.setOutput('PRs', parsedPrList)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
