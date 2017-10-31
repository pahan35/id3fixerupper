var fs  = require('fs');
var inquirer    = require('inquirer');
var CLI         = require('clui');
var Spinner     = CLI.Spinner;
var NodeID3 = require('node-id3');
var chalk       = require('chalk');
var request = require('request');
var getArtistTitle = require('get-artist-title');
var logUpdate = require('log-update');

const IMG_FILENAME = 'tmp.png';
const NA = '';
const ENCODED_BY = 'https://github.com/evanvin';

var spinInterval;
var currID3;
var lastFm;

module.exports = {
	fixSingle : function(lfm){
		lastFm = lfm;
		fs.readdir('./', function(err, files){
			inquirer.prompt([
			{
				type: 'list',
				name: 'file',
				message: 'What file would you like to fix up?',
				choices: files
			}
			]).then(function (choice) {

				fixFile(choice['file'], function(err){
					//return callback(null);
				});

			});

		})
	},
	
	fixMultiple : function(lfm){
		lastFm = lfm;
		fs.readdir('./', function(err, files){

		/*	
			var f;
			for(var i = 0; i < files.length; i++){
				f = files[i];
			//updateProgress(i, files.length);
			if(f.split('.').pop() === 'mp3'){
				fixFile(f, function(err){});

			}
			
		}	*/
		waterfall(files,fixFile,function(){});
		//logUpdate.clear();
	});
	}	
};


function waterfall(files, iterator, callback){
	var next = 0;

	function report(){
		next++;
		if(next === files.length){
			callback();
		}
		else{
			var f = files[next];
			iterator(f, report);
		}
	}
	iterator(files[0], report);
}



function fixFile(file, callback){
	if(file && file.split('.').pop() === 'mp3'){
		var id3 = getCurrentID3(file);
		getTrackInfo(id3, function(res, err){		
			if(err){
				console.log(chalk.red(file + ' had error - ' + err.message));
			}
			else{
				if(res !== ENCODED_BY){			
					console.log(chalk.green(res.name + ' has been successfully fixed!'));
					updateTags(res, function(tags){
						NodeID3.update(tags, file);
						deleteImage(function(){ return null;});
					});
					
				}
				else{
					console.log(chalk.yellow(file + ' has already been fixed!'));
				}
			}
		});
	}
	callback();
}


function getTrackInfo(id3, callback){
	currID3 = id3;
	if(id3 === ENCODED_BY){
		return callback(ENCODED_BY, null);
	}
	else{
		searchTrack(function(mbid, err){
			lastFm.track.getInfo(mbid, function (err, results) {
				if (err) { 
					return callback(null,err); 
				}
				else{
					return callback(results, null);
				}
			});
		});
	}
}

function searchTrack(callback){
	//Call search twice swapping the order of artist and title
	lastFm.track.search(currID3, function (err1, results1) {
		//reverse title and artist and check for that
		currID3 = {'track': currID3.artist, 'artist': currID3.track};

		lastFm.track.search(currID3, function (err2, results2) {
			results1 = results1 || {'trackmatches':{'track':[]}};
			results2 = results2 || {'trackmatches':{'track':[]}};

			if (err2 && err1) { 
				return callback(null,err1); 
			}
			else{
				var chosen;
				if(results1.trackmatches.track.length > results2.trackmatches.track.length){
					chosen = results1.trackmatches.track[0];
				}
				else{
					chosen = results2.trackmatches.track[0];
				}

				if(chosen.mbid)
					return callback({'mbid':chosen.mbid},null);
				return callback({'track': chosen.name, 'artist': chosen.artist}, null);
			}
		});
	});
}


function updateTags(t, callback){
	var img = null;
	if(t.album && t.album.image){
		img = t.album.image[t.album.image.length-1]['#text'] || null;
	}

	getImage(img, function(ib){ 
		return callback(fillTags(t));
	});
}


function fillTags(t){
	let tags = {};
	tags.TIT2 = t.name || NA;
	tags.TOAL = t.name || NA;
	tags.APIC = IMG_FILENAME;

	tags.TALB = (t.album ? t.album.title : 0) || NA;
	tags.TOPE = (t.artist ? t.artist.name : 0) || (t.album ? t.album.artist : 0) || NA;
	tags.TPE1 = (t.artist ? t.artist.name : 0) || (t.album ? t.album.artist : 0) || NA;
	tags.TPE2 = (t.artist ? t.artist.name : 0) || (t.album ? t.album.artist : 0) || NA;

	tags.TCON = (t.toptags ? (t.toptags.tag.map(a => a.name)).join(', ') : 0) || NA;

	if(t.wiki){
		tags.COMM = t.wiki ? {language:'eng', text:t.wiki.content || NA } : NA;
	}

	tags.TENC = ENCODED_BY;
	return tags;
}

function getCurrentID3(file){
	let tags = NodeID3.read(file);
	if(tags.encodedBy === ENCODED_BY){
		return ENCODED_BY;
	}
	else if(tags.title){
		return {'track': tags.title, 'artist': tags.artist};
	}
	file = getArtistTitle(file);
	return {'track': file[1], 'artist': file[0]};
}


function updateProgress(curr, size){
	var s = "[" + chalk.bgMagenta( Array( Math.floor((curr/50)*100)).join(" ") ) + Array( Math.floor(((size-curr)/50)*100)).join(" ") + "] " + (curr/size)*100 + "%";
	logUpdate( s);
}


function getImage(uri, callback){
	if(uri){
		request.head(uri, function(err, res, body){
			request(uri).pipe(fs.createWriteStream(IMG_FILENAME)).on('close', callback);
		});
	}
	else{
		return callback(null);
	}
}

function deleteImage(callback){
	fs.exists(IMG_FILENAME, function(exists) {
		if(exists) {
			fs.unlinkSync(IMG_FILENAME);
		}
		return callback(exists);
	});
}
