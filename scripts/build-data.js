var jiraUtils = require("./jira-utils")
const fetch = require("node-fetch")

const webAdminTokenUrl = "https://web.spin.pm/api/v1/auth_tokens"
const webAdminPushUrl = "https://web.spin.pm/mobile_build"

async function main() {
  await buildDataFromJiraAndPushToAdmin()
}

main()

async function buildDataFromJiraAndPushToAdmin() {
  const issues = await getJiraTickets()
  const linkedIssues = await getLinkedIssues()
  var allIssues = await issues.concat(linkedIssues)
  const releaseUrl = await getReleaseUrl()

  var payload = {
    release_name: jiraUtils.releaseName(),
    release_url: releaseUrl,
    build_group_name: process.env.BITRISE_GIT_TAG,
    build_group_tickets: allIssues,
    mobile_build_name: process.env.BITRISE_BUILD_NUMBER,
    mobile_build_type: process.env.BITRISE_TRIGGERED_WORKFLOW_TITLE,
    mobile_build_url: process.env.BITRISE_PUBLIC_INSTALL_PAGE_URL,
  }

  console.log(payload)
  const token_response = await getJWT()

  try {
    JSON.parse(token_response)
  } catch (e) {
    console.log("Invalid Token Received")
    return false
  }
  const jwt = token_response.json().jwt
  await postPayloadToAdmin(jwt, payload)
}

async function getJiraTickets() {
  await jiraUtils.loadJiraCredentials()
  const ticketsRDE = await jiraUtils.listForTicketsForProject(jiraUtils.projectName)

  var issueURLList = []
  var statuses = [
    "Build Ready",
    "Product QA Ready",
    "Product QA In Progress",
    "Product Release Ready",
    "Product QA Blocked",
    "Released",
  ]

  for (var key in ticketsRDE.issues) {
    if (statuses.includes(ticketsRDE.issues[key].fields.status.name)) {
      var issueURL = jiraUtils.baseUrl + jiraUtils.browseUrl + ticketsRDE.issues[key].key
      issueURLList.push(issueURL)
    }
  }
  return issueURLList
}

async function getReleaseUrl() {
  const releaseInfo = await jiraUtils.getReleaseURL()

  var index = releaseInfo.findIndex((info) => info.name === jiraUtils.releaseName())

  var releaseInformation = releaseInfo[index].self.replace(
    /^https:\/\/spinbikes.atlassian.net\/rest\/api\/3\/version\//,
    ""
  )
  releaseInformation =
    "https://spinbikes.atlassian.net/projects/" +
    jiraUtils.projectId +
    "/versions/" +
    releaseInformation +
    "/tab/release-report-all-issues"
  return releaseInformation
}

async function getLinkedIssues() {
  const linkedIssueList = await jiraUtils.listLinkedIssuesForProjectVersionWrappedByLabel()
  var linkedIssueURLList = []
  for (var key in linkedIssueList) {
    var issueURL = jiraUtils.baseUrl + jiraUtils.browseUrl + linkedIssueList[key]
    linkedIssueURLList.push(issueURL)
  }
  return linkedIssueURLList
}

async function headersForToken() {
  const headers =
    "{  'Accept': 'application/json', 'Content-Type': 'application/json', 'Cookie': 'null', 'api-version': '1.1' }"
  return headers
}

async function getJWT() {
  const headersToSend = headersForToken()

  const requestBody =
    '{ "userUniqueKey": ' +
    process.env.ADMIN_USER_UNIQUE_KEY +
    ', "refreshToken": ' +
    process.env.ADMIN_USER_REFRESH_TOKEN +
    ', "grant_type": "refresh_token" }'

  return await fetch(webAdminTokenUrl, {
    method: "post",
    body: requestBody,
    headers: headersToSend,
  })
}

async function headersWithAuth(jwt) {
  const auth = "Basic " + global.Buffer.from(jwt).toString("base64")
  const header = '{ "Content-Type": "application/json" }, { "Authorization": ' + auth + " }"

  return header
}

async function postPayloadToAdmin(jwt, requestBody) {
  const headersToSend = headersWithAuth(jwt)

  console.log(webAdminPushUrl)
  return await fetch(webAdminPushUrl, {
    method: "post",
    body: JSON.stringify(requestBody),
    headers: headersToSend,
  })
}
