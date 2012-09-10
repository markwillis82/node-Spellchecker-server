var parser = require('xml2json');
var async = require('async');
var request = require('request');

var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});


/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};


exports.delWord = function (req, res){
	var query = req.query.word;
	console.log("Deleted Word: "+query);
	client.del(query,function(err,reply) {
		res.send("OK");
	});
};

exports.addWord = function (req, res){
	var query = req.query.word;
	console.log("Added Word: "+query);
	client.set(query, "valid", function(err,reply) {
		res.send(reply);
	});
};


/** spell checking function **/
exports.spell = function(req, res){
	var query = req.query.text;
	var results = {};
	var reqCallback = false;

	// if callback query parameter - then return correct result
	if(req.query.callback) {
		reqCallback = req.query.callback;
	}


// request to send
	var googleSpell = 'https://www.google.com/tbproxy/spell?lang=en&hl=en';

		// setup XML request
	var baseXml = '<?xml version="1.0" encoding="utf-8" ?>';
	baseXml += '<spellrequest textalreadyclipped="0" ignoredups="0" ignoredigits="1" ignoreallcaps="1">';
	baseXml += '<text>'+query+'</text></spellrequest>';

	request.post(googleSpell, {body : baseXml}, function (e, r, body) {
		if(e) {
			res.send(e.message);
			return;
		};


		// o = start position
		// l = tested word length
		var xml = body;
		var json = parser.toJson(xml, {object: true}); //returns an string containing the json structure by default

		var matches = json.spellresult.c;

		if(!matches) {
			res.send(false);
			return;
		}

		if(matches.length > 1 ) {
			async.forEach(matches,function(key,cb) {
				var startPos = key.o;
				var wordLength = key.l;
				var options = key["$t"];
				client.get(query.substr(startPos,wordLength),function(err,reply) {
					if(!reply) { // if not a valid word - add to results
						if(options.indexOf("\t")) {
							results[query.substr(startPos,wordLength)] = options.split("\t");
						} else {
							results[query.substr(startPos,wordLength)] = options;
						}
					}
					cb();
				});

			}, function(err) {
				if(reqCallback) {
					var str = reqCallback + "(" + JSON.stringify(results) +")";
					res.send(str);
					return;
				}
				res.send(JSON.stringify(results));
			});
		} else {
				var startPos = matches.o;
				var wordLength = matches.l;
				var options = matches["$t"];
				client.get(query.substr(startPos,wordLength),function(err,reply) {
					if(!reply) { // if not a valid word - add to results
						results[query.substr(startPos,wordLength)] = options.split("\t");
					}
					if(reqCallback) {
						var str = reqCallback + "(" + JSON.stringify(results) +")";
						res.send(str);
						return;
					}
					res.send(JSON.stringify(results));
				});
		}
	});

};


