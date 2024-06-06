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

    let repositories = []
    try {
      repositories = JSON.parse(repository)
    } catch (err) {
      repositories = [repository]
    }

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

    const ignored_users_pr_count_per_repository = []

    for (const r of repositories) {
      const [owner, repo] = r.split('/')

      core.debug(`owner: ${owner}`)
      core.debug(`repo: ${repo}`)

      const prList = await octokit.rest.pulls.list({
        owner,
        repo
      })

      let ignored_users_pr_count = 0

      for (const pr of prList.data) {
        const parsedPr = {
          url: pr['html_url'],
          title: pr['title'],
          user: '',
          created_at: pr['created_at']
        }

        if (pr['user']) {
          if (!ignored_users_list.includes(pr['user']['login'])) {
            parsedPr['user'] = pr['user']['login']
            if (!pr['draft']) {
              parsedPrList.push(parsedPr)
            }
          } else {
            ignored_users_pr_count += 1
          }
        }
      }

      if (ignored_users_pr_count !== 0) {
        ignored_users_pr_count_per_repository.push({
          repository: r,
          pr_count: ignored_users_pr_count
        })
      }
    }

    const format = core.getInput('format')
    if (format === 'markdown') {
      let markdownOutput = ''

      for (const pr of parsedPrList) {
        markdownOutput += `* [${pr['title']}](${pr['url']}) by ${pr['user']}\n`
      }

      if (ignored_users_pr_count_per_repository.length !== 0) {
        for (const repo of ignored_users_pr_count_per_repository) {
          markdownOutput += `* ${repo.pr_count} PRs by ignored users in [${repo.repository}](https://github.com/${repo.repository}/pulls)\n`
        }
      }
      core.setOutput('PRs', markdownOutput)
    } else {
      core.setOutput('PRs', parsedPrList)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
