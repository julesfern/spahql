var fs = require("fs");
var buildJSON = fs.readFileSync(__dirname+"/build.json", "utf-8");
var buildData = JSON.parse(buildJSON);
var files = buildData.files;

var dir = __dirname;
for(var i in files) {
	var path = dir+"/"+files[i];
	//console.log("Requiring "+path);
	require(path);
}

exports = SpahQL;
exports.spahBuildFiles = files;