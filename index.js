#!/usr/bin/env node

var chalk       = require('chalk');
var clear       = require('clear');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var fix = require('./lib/fix');

menu();

setConsoleOptions();


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
			fix.fixSingle();
		}
		else if(answers["choice"] === 'Exit'){
			exit();
		}
		else{
			fix.fixMultiple();
		}
	});
}

function setConsoleOptions() {
	const options = {};

	if (process.argv.indexOf('--from-file-name') != -1) {
		options.needFillTagsFromFileName = true;
	}

	fix.setSearchOptions(options);
}

function exit(){
	clear();
	console.log(
		chalk.yellow(
			figlet.textSync('Buh Bye Now')
			)
		);
}
