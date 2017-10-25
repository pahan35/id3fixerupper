#!/usr/bin/env node

var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
var fs          = require('fs');
var NodeID3 = require('node-id3');
var LastfmAPI = require('lastfmapi');
var request = require('request');
var clui = require('clui');

const logUpdate = require('log-update');

var lfm;

var currID3;
var hasPrefs = false;


/*
Application name	id3fixer
API key	b61d96ee5bf068438491debbcd1b4ef5
Shared secret	a91413174b184eb4c87614ae961a3739
Registered to	zaaking
*/







function fixSingle(){

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

/*

			var id3 = getCurrentID3(choice['file']);


			getTrackInfo(id3, function(res, err){
				status.stop();
				if(err){
					console.log(chalk.red(err.message));
				}
				else{
					updateTags(res, function(tags){
						//console.log(tags);
						NodeID3.update(tags, choice['file']);

						deleteImage(function(){ return null;});
					});
				}
			});
			*/
		});

	})
}



function fixMultiple(){
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



function fixFile(file, status, callback){

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
		lfm.track.getInfo(mid, function (err, results) {
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
	lfm.track.search(currID3, function (err, results) {
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



function getLastFmCredentials(callback) {
	var questions = [
	{
		type: 'input',
		name: 'key',
		message: 'What\'s your last.fm api key?'
	},
	{
		type: 'input',
		name: 'secret',
		message: 'What\'s your last.fm api secret?'
	},
	{
		type: 'input',
		name: 'username',
		message: 'What\'s your last.fm api username?'
	}
	];

	inquirer.prompt(questions).then(callback);
}


function getLastFmToken(callback) {
	var prefs = new Preferences('id3fixerupper');

	if (prefs.ifu && prefs.ifu.key) {
		hasPrefs = true;
		return callback(null, prefs.ifu);
	}

	getLastFmCredentials(function(creds) {
		var status = new Spinner('Authenticating you, please wait...');
		status.start();


		var l = new LastfmAPI({
			'api_key' : creds.key,
			'secret' : creds.secret
		});
		l.setSessionCredentials(creds.username, 123456);


		l.track.search({
			'artist' : 'The White Stripes',
			'track' : 'Seven Nation Army'
		}, function (err, res) {
			status.stop();
			if (err) { 
				return callback(err); 
			}
			if(res){
				prefs.ifu = {
					key : creds.key,
					secret : creds.secret,
					username : creds.username
				};
				return callback(null, creds);
			}
			return callback();
		});
	});
}




function lastFmAuth(callback) {
	getLastFmToken(function(err, creds) {
		if (err) {
			return callback(err);
		}
		lfm = new LastfmAPI({
			'api_key' : creds.key,
			'secret' : creds.secret
		});
		lfm.setSessionCredentials(creds.username, 123456);
		return callback(null, creds.key);
	});
}

lastFmAuth(function(err, authed) {
	if (err) {
		console.log(chalk.red(err.message));
		switch (err.code) {
			case 401:
			console.log(chalk.red('Couldn\'t log you in. Please try again.'));
			break;
			case 422:
			console.log(chalk.red('You already have an access token.'));
			break;
		}
		return;
	}
	if (authed) {
		if(!hasPrefs)
			console.log(chalk.green('Successfully authenticated!'));
		menu();
	}
});

function exit(){
	clear();
	console.log(
		chalk.yellow(
			figlet.textSync('Buh Bye Now')
			)
		);
}



function menu(){

	clear();
	console.log(
		chalk.cyan(
			figlet.textSync('ID3 Fixer Upper')
			)
		);

	inquirer.prompt([
	{
		type: 'list',
		name: 'choice',
		message: 'What do you want to do?',
		choices: [
		'Fix the files in this directory',
		'Fix a single MP3',
		'Exit'
		]
	}
	]).then(function (answers) {


		if(answers["choice"] === 'Fix a single MP3'){
			fixSingle();
		}
		else if(answers["choice"] === 'Exit'){
			exit();
		}
		else{
			fixMultiple();
		}
	});
}



function updateProgress(curr, size){
	var s = "[" + chalk.bgMagenta( Array( Math.floor((curr/50)*100)).join(" ") ) + Array( Math.floor(((size-curr)/50)*100)).join(" ") + "] " + (curr/size)*100 + "%";
	logUpdate( s);
}


/*
var i = 0;
setInterval(function(){
	var x = i++;
	updateProgress(x, 10);
	if(i == 10){
		logUpdate( "");
		console.log("DONE");
		process.exit(0);
	}
}, 400)
*/