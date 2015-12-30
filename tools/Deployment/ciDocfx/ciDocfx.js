var fs = require('fs');
var path = require('path');
var util = require('util');
var program = require('commander');
var jszip = require('jszip');
var config = require('nconf');
var ciUtil = require('../ciUtil');

config.add('global', {type: 'file', file: 'config.json'});
config.add('user', {type: 'file', file: 'ciDocfx/config.json'});

var docfxConfig = config.get('docfx');
var gitConfig = config.get('git');
var mygetConfig = config.get('myget');

var uploadMyget = function(nugetExe, releaseFolder, apiKey, sourceUrl) {
  fs.readdirSync(releaseFolder).forEach(function(file, index) {
    var subPath = path.join(releaseFolder, file);
    if (fs.lstatSync(subPath).isFile() && file.indexOf('symbol') === -1) {
      ciUtil.exec('.', nugetExe, ['push', subPath, apiKey, '-Source', sourceUrl]);
    }
  });
}

var zipDocfx = function(fromDir, destDir) {
  var zip = new jszip();
  fs.readdirSync(fromDir).forEach(function(file) {
    var filePath = path.join(fromDir, file);
    if (fs.lstatSync(filePath).isFile()) {
      var ext = path.extname(filePath);
      if (ext !== '.xml' && ext !== '.pdb') {
        var content = fs.readFileSync(filePath);
        zip.file(file, content);
      }
    }
  });
  var buffer = zip.generate({type:"nodebuffer", compression: "DEFLATE"});
  fs.unlinkSync(destDir);
  fs.writeFileSync(destDir, buffer);
}

program
.option('--step1', 'clear artifacts/Release')
.option('--step2', 'build docfx')
.option('--step3', 'upload myget.org')
.option('--step4', 'generate gh-pages')
.option('--step5', 'zip docfx.exe')
.option('--step6', 'update gh-pages')
.parse(process.argv);

if (program.step1) {
  ciUtil.remove(docfxConfig["releaseFolder"]);
}
if (program.step2) {
  ciUtil.exec(docfxConfig['homeFolder'], 'build.cmd', []);
}
if (program.step3) {
  uploadMyget(mygetConfig['nugetExe'], docfxConfig['releaseFolder'], mygetConfig['apiKey'], mygetConfig['sourceUrl']);
}
if (program.step4) {
  ciUtil.exec(docfxConfig['docFolder'], path.resolve(docfxConfig['docfxExe']), []);
}
if (program.step5) {
  zipDocfx(docfxConfig['zipSrcFolder'], docfxConfig['zipDestFolder']);
}
if (program.step6) {
  ciUtil.replaceUpdateRepo(docfxConfig['repoUrl'], "docfxGhPages", docfxConfig['docSiteFolder'], "_site", 'gh-pages', gitConfig['msg'], gitConfig['username'], gitConfig['email']);
}
