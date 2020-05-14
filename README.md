# TurnipBot

TurnipBot is a simple discord bot that collects animal crossing turnip prices from a shared google sheet, crunches some numbers, determines who will have a large spike in prices, and then returns that data to a discord channel.

Prediction code stolen from [mikebryant](https://github.com/mikebryant/ac-nh-turnip-prices), which was adapted from [Ninji' original work](https://gist.github.com/Treeki/85be14d297c80c8b3c0a76375743325b).

## Useage

Requires [npm google-spreadsheet](https://www.npmjs.com/package/google-spreadsheet) and [npm discord.js](https://discord.js.org/#/) to operate. Credentials.json needs to be edited to include the sheetid for the google spreadsheet.

To run, simply execute:
```sh
$ node turnip.js
```
or in my case running in the background (on linux):
```sh
$ nohup node turnip.js >/dev/null & 
```