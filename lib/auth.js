var fs  = require('fs');
var inquirer    = require('inquirer');
var CLI         = require('clui');
var Spinner     = CLI.Spinner;
var Preferences = require('preferences');
var LastfmAPI = require('lastfmapi');
var logUpdate = require('log-update');
var lfm;

module.exports = {

	lastFmAuth : function(callback) {
		getLastFmToken(function(err, creds) {
			if (err) {
				return callback(err);
			}
			lfm = new LastfmAPI({
				'api_key' : creds.key,
				'secret' : creds.secret
			});
			lfm.setSessionCredentials(creds.username, 123456);
			return callback(null, creds.key, lfm);
		});
	}


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