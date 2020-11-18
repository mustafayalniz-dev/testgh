var jiraUtils = require("./jira-utils")

async function main() {
  await transitionAllIssues()
}

main()

async function transitionAllIssues() {
  var statuses = ["Product Release Ready"]
  const issues = await getJiraTickets(statuses)

  const linkedIssues = await getLinkedIssues(statuses)
  var allIssues = await issues.concat(linkedIssues)

  await transitionIssuesAsReleased(allIssues)
}

async function transitionIssuesAsReleased(issues) {
  issues.forEach(async function (issue, index) {
    var issue_id = issue.replace(/https:\/\/spinbikes.atlassian.net\/browse\/browse\//, "")
    var isReleaseReady = await jiraUtils.isReleaseReady(issue_id)

    if (isReleaseReady) {
      console.log("Transitioning " + index + " ticket " + issue_id + " to Released")
      await jiraUtils.transitionRequest(issue_id, jiraUtils.jiraTransitionIdReleased)
    }
  })
}

async function getJiraTickets(statuses) {
  await jiraUtils.loadJiraCredentials()
  const ticketsRDE = await jiraUtils.listForTicketsForProject(jiraUtils.projectName)

  var issueURLList = []

  for (var key in ticketsRDE.issues) {
    if (statuses.includes(ticketsRDE.issues[key].fields.status.name)) {
      var issueURL = jiraUtils.baseUrl + jiraUtils.browseUrl + ticketsRDE.issues[key].key
      issueURLList.push(issueURL)
    }
  }
  return issueURLList
}

async function getLinkedIssues(statuses) {
  const linkedIssueList = await jiraUtils.listLinkedIssuesForProjectVersionWrappedByLabel(statuses)
  var linkedIssueURLList = []
  for (var key in linkedIssueList) {
    var issueURL = jiraUtils.baseUrl + jiraUtils.browseUrl + linkedIssueList[key]
    linkedIssueURLList.push(issueURL)
  }
  return linkedIssueURLList
}
