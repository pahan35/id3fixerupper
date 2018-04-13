var fs  = require('fs');
var inquirer    = require('inquirer');
var NodeID3 = require('node-id3');
var chalk       = require('chalk');
var getArtistTitle = require('get-artist-title');
var Leven = require('levenshtein');

const Discogs = require('disconnect').Client;

const db = new Discogs({
	consumerKey: 'WIqEZEIdMlfLsXGkWkKn', 
	consumerSecret: 'YeDwBlkyXEtNjIYJOGuFSfZfjmywPmsF'
}).database();

const IMG_FILENAME = 'tmp.jpg';
const NA = '';
const ENCODED_BY = 'https://github.com/evanvin';

var isMultiple = false;
var multipleIndex = 0;
var multipleFiles;

var currFile;
var currID3;
var currTags;

var currMasterId;
var currMasterRelease;
var currSearchResult = {};

let needFillTagsFromFileName = false;
let hasTags = false;


module.exports = {
	fixSingle : function(){
		resetVariables();
		isMultiple = false;
		fs.readdir('./', function(err, files){
			inquirer.prompt([
			{
				type: 'list',
				name: 'file',
				message: 'What file would you like to fix up?',
				choices: files
			}
			]).then(function (choice) {
				doFix(choice['file']);
			});

		})
	},

	fixMultiple : function(){
		resetVariables();
		isMultiple = true;
		fs.readdir('./', function(err, files){
			multipleFiles = files;
			doFix(multipleFiles[multipleIndex]);
		});
	},
	setSearchOptions(options) {
		if (options.hasOwnProperty('needFillTagsFromFileName')) {
			needFillTagsFromFileName = true;
		}
	}
};



function doFix(file){
	if(file && file.split('.').pop() === 'mp3'){
		currFile = file;
		currID3 = getCurrentID3(file);
		if(currID3 !== ENCODED_BY){
			db.search(currID3, {type:'master'}, searchResults);
		}
		else{
			console.log(chalk.yellow(file + ' has already been fixed!'));
			goNext();
		}
	}
	else{
		goNext();
	}

	function searchResults(err, data){
		if(data && data.results && data.results.length > 0){
			currSearchResult = data.results[0];
			if(currSearchResult.id){
				currMasterId = currSearchResult.id;
				var imgURL = currSearchResult.thumb || null;
				getInformation();
			}
			else{
				noSearchDataFound();
			}
		}
		else{
			noSearchDataFound();
		}

		function noSearchDataFound() {
			console.log(chalk.red('We could not find any data for that song.'));
			if(needFillTagsFromFileName){
				checkTitleInfo();
			}
		}
	}

	function checkTitleInfo() {
		if(hasTags){
			console.log(chalk.yellow('File ' + file + ' already has tags'));
			goNext();
		}
		else{
			console.log(chalk.yellow('Tag filled from filename' + file));
			currSearchResult = {};
			const parts = currID3.split(' - ');
			currMasterRelease = {
				artists: [{name: parts[1]}],
				genres: [],
				title: parts[0]
			};
			fillTags();
		}
	}
}

function getInformation(){
	db.getMaster(currMasterId, saveImage);
}

function saveImage(err, masterRelease){
	currMasterRelease = masterRelease;
	if(currMasterRelease){
		if(currMasterRelease.images[0].resource_url){
			db.getImage(currMasterRelease.images[0].resource_url, function(err, data, rateLimit){
				require('fs').writeFile(IMG_FILENAME, data, 'binary', fillTags);
			});
		}
		else{
			fillTags(null);
		}
	}
	else{
		console.log(chalk.red('No master release was found for that song.'));
		goNext();
	}
}



function fillTags(err){
	const t = currMasterRelease;

	if(err){
		console.log(chalk.red(err));
		goNext();
	}
	else{
		var song = getSongTitle();
		var artist = t.artists[0].name || NA;

		let tags = {};
		tags.TIT2 = song.title;
		tags.TOAL = song.title;
		tags.APIC = IMG_FILENAME;
		tags.TRCK = song.position || NA;

		tags.TYER = t.year || NA;

		tags.TALB = t.title || NA;
		tags.TOPE = artist;
		tags.TPE1 = artist;
		tags.TPE2 = artist;

		tags.TCON = t.genres.join(', ') || NA;

		tags.COMM = t.notes || NA;

		tags.TENC = ENCODED_BY;

		currTags = tags;

		NodeID3.write(tags, currFile, deleteImage);
	}

}



function deleteImage(err){
	if(err){
		console.log(chalk.red(err));
		goNext();
	}
	else{
		//check if image exists and then delete
		fs.exists(IMG_FILENAME, function(exists) {
			if(exists) {
				fs.unlinkSync(IMG_FILENAME);
			}
			goNext();
		});
	}
}











function getSongTitle(){
	if(currMasterRelease.tracklist && currMasterRelease.tracklist.length > 0){
		var ans = {dist: 10000, title:'', position: 0};
		currMasterRelease.tracklist.forEach(function(track) {
			var l = new Leven(currFile, track.title).distance;
			if(l < ans.dist){
				ans.dist = l;
				ans.title = track.title || '';
				ans.position = track.position || '';
			}
		});
		return ans;
	}
	else{
		return {dist: 100000, song: currSearchResult.title || currMasterRelease.title || NA, position : 0};
	}
}

function getCurrentID3(file){
	tags = NodeID3.read(file)
	if(tags){
		if(tags.encodedBy === ENCODED_BY){
			return ENCODED_BY;
		}
		else if(tags.title){
			hasTags = true;
			return tags.title + ' - ' + tags.artist;
		}
	}
	file = getArtistTitle(file);
	return file[1] + ' - ' + file[0];
	
}

function goNext(){
	hasTags = false;
	if(isMultiple && multipleIndex+1 < multipleFiles.length ){
		doFix(multipleFiles[++multipleIndex]);
	}
}


/*
function deleteImage(callback){
	fs.exists(IMG_FILENAME, function(exists) {
		if(exists) {
			fs.unlinkSync(IMG_FILENAME);
		}
		return callback(exists);
	});
}
*/

function resetVariables(){
	multipleIndex = 0;
	multipleFiles = null;
	currTags = null;
	currMasterId = null;
	currMasterRelease = null;
	currSearchResult = {};
	hasTags = false;
}
