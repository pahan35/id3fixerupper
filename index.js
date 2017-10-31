#!/usr/bin/env node

var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var clui = require('clui');
var auth = require('./lib/auth');
var fix = require('./lib/fix');
var lastFm;
var hasPrefs = false;



auth.lastFmAuth(function(err, authed, lfm) {
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
		lastFm = lfm;
		if(!hasPrefs)
			console.log(chalk.green('Successfully authenticated!'));
		menu();
	}
});


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
			fix.fixSingle(lastFm);
		}
		else if(answers["choice"] === 'Exit'){
			exit();
		}
		else{
			fix.fixMultiple(lastFm);
		}
	});
}

function exit(){
	clear();
	console.log(
		chalk.yellow(
			figlet.textSync('Buh Bye Now')
			)
		);
}
