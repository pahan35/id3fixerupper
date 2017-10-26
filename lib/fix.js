var fs  = require('fs');
var inquirer    = require('inquirer');
var CLI         = require('clui');
var Spinner     = CLI.Spinner;
var NodeID3 = require('node-id3');
var chalk       = require('chalk');

var currID3;
var lastFm;

module.exports = {


	getCurrentDirectoryBase : function() {
		return path.basename(process.cwd());
	},

	directoryExists : function(filePath) {
		try {
			return fs.statSync(filePath).isDirectory();
		} catch (err) {
			return false;
		}
	},


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
				var status = new Spinner('Fixing up your file...');
				status.start();


				fixFile(choice['file'], status, function(err){
					return callback(null);
				});

			});

		})
	},


	
	fixMultiple : function(lfm){
		lastFm = lfm;
		fs.readdir('./', function(err, files){
			var status = new Spinner('Fixing up your files...');
			status.start();
			var f;
			for(var i = 0; i < files.length; i++){
				f = files[i];
			//updateProgress(i, files.length);
			if(f.split('.').pop() === 'mp3'){
				console.log(f);
				fixFile(f, status, function(err){});
			}
		}	
		logUpdate.clear();
		status.stop();
	});
	}



	



	
};


function fixFile(file, status, callback){
	console.log(">>>>>");
	console.log(lastFm);

	var id3 = getCurrentID3(file);
	getTrackInfo(id3, function(res, err){
		status.stop();
		if(err){
			console.log(chalk.red(err.message));
		}
		else{
			updateTags(res, function(tags){
				//console.log(tags);
				NodeID3.update(tags, file);

				deleteImage(function(){ return null;});
			});
		}
	});
}


function getImage(uri, title, callback){
	request.head(uri, function(err, res, body){
		request(uri).pipe(fs.createWriteStream('tmp.png')).on('close', callback);
	});
}

function deleteImage(callback){
	fs.exists('tmp.png', function(exists) {
		if(exists) {
			fs.unlinkSync('tmp.png');
		}
		return callback(exists);
	});
}




function updateTags(t, callback){
	getImage(t['album']['image'][t['album']['image'].length-1]['#text'], t['album']['title'], function(ib){ 
		let tags = {
			TIT2: t['name'],
			TALB: t['album']['title'],
			TCON: t['toptags']['tag'].length > 0 ? t['toptags']['tag'][0]['name'] : '',
			TPE1: t['artist']['name'],
			//TYER ,
			APIC: 'tmp.png',


		};
		return callback(tags);
	});
}



function getTrackInfo(id3, callback){
	var status = new Spinner('Finding song...');
	status.start();
	currID3 = id3;

	searchTrack(function(mid, err){
		lastFm.track.getInfo(mid, function (err, results) {
			status.stop();
			if (err) { 
				return callback(null,err); 
			}
			else{
				return callback(results, null);
			}
		});
	});
}

function searchTrack(callback){
	lastFm.track.search(currID3, function (err, results) {
		if (err) { 
			return callback(null,err); 
		}
		else{
			let track = results['trackmatches']['track'][0];
			if(track['mbid'])
				return callback({'mbid':track['mbid']},null);
			return callback({'track': track['name'], 'artist': track['artist']}, null);
		}
	});
}


function getCurrentID3(file){
	let tags = NodeID3.read(file);
	if(tags.title){
		return {'track': tags.title, 'artist': tags.artist};
	}
	file = file.slice(0,-4).split('-');
	return {'track': file[1], 'artist': file[0]};
}


function updateProgress(curr, size){
	var s = "[" + chalk.bgMagenta( Array( Math.floor((curr/50)*100)).join(" ") ) + Array( Math.floor(((size-curr)/50)*100)).join(" ") + "] " + (curr/size)*100 + "%";
	logUpdate( s);
}