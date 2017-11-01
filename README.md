
<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/evanvin/id3fixerupper/master/img/fixer.png" alt="ID3 Fixer Upper" width="250">
  <br>
</h1>

<h4 align="center">A commandline tool to correct ID3 tags on MP3 files built with <a href="https://nodejs.org/" target="_blank">NodeJS</a>.</h4>


<p align="center">
  <a href="https://www.npmjs.com/package/id3fix">
    <img src="https://badge.fury.io/js/id3fix.svg"
         alt="NPM">
  </a>
</p>


![screenshot](https://raw.githubusercontent.com/evanvin/id3fixerupper/master/img/id3fix.gif)

## Key Features

* Single file corrections
* Mutliple file corrections

## How To Use

### 1. You will need to set up a LastFM API account and get a key and secret

### 2. Install using npm

```bash
# Download and install the package
> npm i -g id3fix

# Navigate to the folder where the MP3(s) are 

# Start id3fix
> id3fix

```




## Download

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
> git clone https://github.com/evanvin/id3fixerupper.git

# Go into the repository
> cd id3fixerupper

# Install dependencies
> npm install

# Run the app
> npm start
```


## Credits

This software uses code from several open source packages.

- [Node.js](https://nodejs.org/)
- [chalk](https://www.npmjs.com/package/chalk) - for terminal string styling 
- [clear](https://www.npmjs.com/package/clear) - clears the terminal
- [clui](https://www.npmjs.com/package/clui) - for quickly building nice looking command line interfaces
- [figlet](https://www.npmjs.com/package/figlet) - allows you to create ASCII Art from text
- [get-artist-title](https://www.npmjs.com/package/get-artist-title) -  get artist and title from a string
- [inquirer](https://www.npmjs.com/package/inquirer) - A collection of common interactive command line user interfaces
- [lastfmapi](https://www.npmjs.com/package/lastfmapi) - last fm api wrapper
- [log-update](https://www.npmjs.com/package/log-update) - for overwriting the previous output in the terminal
- [node-id3](https://www.npmjs.com/package/node-id3) - a ID3 tag library
- [preferences](https://www.npmjs.com/package/preferences) - for handling encrypted user preferences


#### License

MIT

---

> [evan.vin](http://www.evan.vin) &nbsp;&middot;&nbsp;
> GitHub [@evanvin](https://github.com/evanvin) &nbsp;&middot;&nbsp;

