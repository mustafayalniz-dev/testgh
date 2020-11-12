const fetch = require("node-fetch")
const promisify = require("util").promisify
const fs = require("fs")
const readFile = promisify(fs.readFile)

const JIRA_USERNAME = process.env.JIRA_USERNAME
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))

const baseUrl="https://spinbikes.atlassian.net"
const issueBaseUrl="/rest/api/2/issue/"

async function main() {
    await processCommits()
}

main()

async function headersWithAuth(headers) {
    const auth =
      "Basic " + global.Buffer.from(JIRA_USERNAME + ":" + JIRA_API_TOKEN).toString("base64")
    return Object.assign(headers, { Authorization: auth })
}

async function processCommits() {

  var branch = event.ref.replace("refs/heads/", "")
  var issueIdRegex = new RegExp("^\[[A-Z]+\-[0-9]+\].+$")

  for (var key in event.commits) {
    if (event.commits[key].id) {
        var id = event.commits[key].id 
    }
    if (event.commits[key].message) {
        var message =  event.commits[key].message
    }
    if (event.commits[key].url) {
        var url = event.commits[key].url
    }
    if (issueIdRegex.test(message)) {
      var issueKey=message.replace(/^\[([A-Z]+\-[0-9]+)\].+$/, "$1")
      await processSingleCommit(branch, id, issueKey, message, url)
    }
  }

}

async function processSingleCommit(branch, id, issueKey,  message, url) {
     headers = await headersWithAuth({ "Content-Type": "application/json" })
     var repository = url.replace(/\/commit\/.+/, "")
     var body = "Repository: " + repository + "\nBranch: " + branch + "\nCommit: [" + id + "|" + url + "]\nCommit message: " + message

     var issueComment = {
    	"body": body 
     } 

     jiraPushUrl = baseUrl + issueBaseUrl + issueKey + "/comment"

     console.log(jiraPushUrl)
     console.log(JSON.stringify(issueComment))
     console.log(headers)

     return await fetch(jiraPushUrl, {
       method: "post",
       body: JSON.stringify(issueComment),
       headers: headers
     })

}

