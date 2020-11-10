var child_process = require("child_process")
const fetch = require("node-fetch")
const promisify = require("util").promisify
const fs = require("fs")
const dotenv = require("dotenv")
const readFile = promisify(fs.readFile)

var commits = process.argv.slice(2)

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))

//console.log(event)
//console.log(event)

const baseUrl="https://spinbikes.atlassian.net"
const jqlSearchBaseUrl="/rest/api/2/search/?jql="
const issueBaseUrl="/rest/api/2/issue/"
const transitionUrl="/transitions"
const browseUrl="/browse/"

async function main() {
    await loadJiraCredentials()
    await postPayloadToAdmin()
}

main()

async function loadJiraCredentials() {
    const envfile = await readFile("./.env", "utf-8")
    const env = dotenv.parse(global.Buffer.from(envfile))
    JIRA_USERNAME = env.JIRA_USERNAME
    JIRA_API_TOKEN = env.JIRA_API_TOKEN
}

async function headersWithAuth(headers) {
    const auth =
      "Basic " + global.Buffer.from(JIRA_USERNAME + ":" + JIRA_API_TOKEN).toString("base64")
    return Object.assign(headers, { Authorization: auth })
}

async function postPayloadToAdmin() {

  await processCommits()

//  return await fetch(webAdminPushUrl, {
//    method: "post",
//    body: JSON.stringify(requestBody),
//    headers: headersToSend,
//  })
}

async function processCommits() {

  var branch = event.ref.replace("refs/heads/", "")

  var issueIdRegex = new RegExp("^\[[A-Z]+\.[0-9]+\].+$")

  var id = ""
  var message = ""
  var url = ""
  var issueKey= ""

  for (var key in event.commits) {
    if (event.commits[key].id) {
        id = event.commits[key].id 
    }
    if (event.commits[key].message) {
        message =  event.commits[key].message
    }
    if (event.commits[key].url) {
        url = event.commits[key].url
    }
    if (issueIdRegex.test(message)) {
      issueKey=message.replace(/^\[([A-Z]+\.[0-9]+)\].+$/, "$1")
      await processSingleCommit(branch, id, issueKey, message, url)
    }
  }

}

async function processSingleCommit(branch, id, issueKey,  message, url) {
     headers = await headersWithAuth({ "Content-Type": "application/json" })

     var issueComment = {
    	"body": "Commit " + id + " with url: " + url + " has been pushed to branch: " + branch + " with message " + message 
     } 

     console.log("BRANCH=" + branch + "\nSHA=" + id + "\nMESSAGE=" + message + "\nURL=" + url)
     console.log(issueComment)
}

