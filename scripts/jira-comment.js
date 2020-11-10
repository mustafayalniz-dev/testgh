var child_process = require("child_process")
const fetch = require("node-fetch")
const promisify = require("util").promisify
const fs = require("fs")
const dotenv = require("dotenv")
const readFile = promisify(fs.readFile)

var commits = process.argv.slice(2)

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))

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
  headers = await headersWithAuth({ "Content-Type": "application/json" }),

  console.log(headers)

//  console.log(event.commits) 
  for (var key in event.commits) {
    if (statuses.includes(event.commits[key].id)) {
	console.log("id = " + id )
    }
    if (statuses.includes(event.commits[key].message)) {
        console.log("message = " + message )
    }
    if (statuses.includes(event.commits[key].url)) {
        console.log("url = " + url )
    }
  }

  console.log("REF = " + event.ref)


//  return await fetch(webAdminPushUrl, {
//    method: "post",
//    body: JSON.stringify(requestBody),
//    headers: headersToSend,
//  })
}



