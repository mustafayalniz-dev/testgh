var child_process = require("child_process");

//const GITHUB_REF = process.env.GITHUB_REF
//const currentBranch = GITHUB_REF.replace("refs/heads/", "")

var currentBranch = process.argv.slice(2)[0]


if ( currentBranch == "" ) {
	console.log("You need to give current branch")
	return 1
}

major_version = ('0' + parseInt(currentBranch.replace(/release\_(\d+)\.\d+\.\d+/,'$1'))).slice(-3)
minor_version = ('0' + parseInt(currentBranch.replace(/release\_\d+\.(\d+)\.\d+/,'$1'))).slice(-3)
patch_version = ('0' + parseInt(currentBranch.replace(/release\_\d+\.\d+\.(\d+)/,'$1'))).slice(-3)

var versionNumber = major_version.toString() + minor_version.toString() + patch_version.toString()

async function getBranchArray() { 
    
//    var test0 = child_process.execSync('git pull');
    var test = child_process.execSync('git branch --remote -a | grep release');
    var branches = test.toString().replace(/remotes\/origin\//g,"").replace(/\s+/g, ' ').trim()
    var branchArray = branches.split(" ");
    
//    console.log(branchArray)
    return branchArray ;

}

async function getMinorVersionArray(array) {

	var matrixJson = ""

	array.forEach(function(item){
                itemMajor = item.replace(/release\_(\d+)\.\d+\.\d+/,'$1')
		itemMinor = item.replace(/release\_\d+\.(\d+)\.\d+/,'$1')
		itemPatch = item.replace(/release\_\d+\.\d+\.(\d+)/,'$1')
		majorVersionInRemote = ('0' + itemMajor).slice(-3)
		minorVersionInRemote = ('0' + itemMinor).slice(-3)
		patchVersionInRemote = ('0' + itemPatch).slice(-3)
		
		var versionNumberInRemote = majorVersionInRemote.toString() + minorVersionInRemote.toString() + patchVersionInRemote.toString() 

		if ( parseInt(versionNumber) < parseInt(versionNumberInRemote) ) {
			if ( matrixJson != "")  {  matrixJson = matrixJson + "," }
			matrixJson = matrixJson + "{ \"upstream_release\": \"" + item + "\" }"
		}
	});

	matrixJson = "{ \"include\": [" + matrixJson + "] }"

	return matrixJson

} 

async function main() {
    var array = await getBranchArray()
    var matrix = await getMinorVersionArray(array)
        

    console.log(matrix)
}

main()


