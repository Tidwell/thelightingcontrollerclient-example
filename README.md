#thelightingcontrollerclient Example App

1. [Overview](#overview)
2. [Setup](#setup)
3. [Instantiation](#instantiation)
4. [Methods](#methods)

# Overview

This is an example for [thelightingcontrollerclient](https://github.com/Tidwell/thelightingcontrollerclient) library.  It replicates [TheLightingController's Live Mobile App](http://www.thelightingcontroller.com/viewtopic.php?f=47&t=836).

This demo shows a http + socket webserver using thelightingcontrollerclient.  It serves a replica of the Live Mobile App that can log into any Live instance on your network.

The following libraries are used:

Backend
- express
- socket.io
- thelightingcontrollerclient

The frontend uses
- angular 1.5
- angular material


# Setup

Clone the repo

```bash
	$ git clone https://github.com/Tidwell/thelightingcontrollerclient-example.git
```

Navigate to the folder and npm install

```bash
	$ cd thelightingcontrollerclient-example
	$ npm install
```

Start the Server

```bash
	$ npm start
```

View

```bash
	open http://localhost:3000
```
