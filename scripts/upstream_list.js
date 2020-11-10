var child_process = require("child_process")

//const GITHUB_REF = process.env.GITHUB_REF
//const currentBranch = GITHUB_REF.replace("refs/heads/", "")

var currentBranch = process.argv.slice(2)[0]

const reviewers = "../prmeta.json"
const prMeta = require(reviewers)

if (currentBranch === "") {
  console.log("You need to give current branch")
  return 1
}

const major_version = ("0000" + parseInt(currentBranch.replace(/release\_(\d+)\.\d+\.\d+/, "$1"))).slice(-5)
const minor_version = ("0000" + parseInt(currentBranch.replace(/release\_\d+\.(\d+)\.\d+/, "$1"))).slice(-5)
const patch_version = ("0000" + parseInt(currentBranch.replace(/release\_\d+\.\d+\.(\d+)/, "$1"))).slice(-5)

var versionNumber = major_version.toString() + minor_version.toString() + patch_version.toString()

async function getBranchArray() {
  //    var test0 = child_process.execSync('git pull');
  var test = child_process.execSync("git branch --remote -a | grep release")
  var branches = test
    .toString()
    .replace(/remotes\/origin\//g, "")
    .replace(/\s+/g, " ")
    .trim()
  var branchArray = branches.split(" ")

  return branchArray
}

async function getMinorVersionArray(array) {
  var matrixJson = ""

  var releaseBranchRegex = new RegExp("^release_[0-9]+\.[0-9]+\.[0-9]+$");

  array.forEach(function (item) {
    if (! releaseBranchRegex.test(item)) {
	return 
    }
    var itemMajor = item.replace(/release\_(\d+)\.\d+\.\d+/, "$1")
    var itemMinor = item.replace(/release\_\d+\.(\d+)\.\d+/, "$1")
    var itemPatch = item.replace(/release\_\d+\.\d+\.(\d+)/, "$1")
    var majorVersionInRemote = ("0000" + itemMajor).slice(-5)
    var minorVersionInRemote = ("0000" + itemMinor).slice(-5)
    var patchVersionInRemote = ("0000" + itemPatch).slice(-5)

    var versionNumberInRemote =
      majorVersionInRemote.toString() +
      minorVersionInRemote.toString() +
      patchVersionInRemote.toString()

    if ( isNaN( parseInt(versionNumberInRemote) ) ) {
        return
    }

    if (parseInt(versionNumber) < parseInt(versionNumberInRemote)) {
      if (matrixJson != "") {
        matrixJson = matrixJson + ","
      }
      matrixJson =
        matrixJson +
        '{ "upstream_release": "' +
        item +
        '", "reviewers": "' +
        prMeta.prReviewers +
        '", "assignees": "' +
        prMeta.prAssignees +
        '"  }'
    }
  })

  matrixJson = '{ "include": [' + matrixJson + "] }"

  return matrixJson
}

async function main() {
  var array = await getBranchArray()
  var matrix = await getMinorVersionArray(array)

  console.log(matrix)
}

main()
