//initialize required modules
var http = require('http')
var fs = require("fs");
var config = JSON.parse(fs.readFileSync("config.json"));
var port = process.env.PORT || 5000;
var express = require("express")
var app = express();
var ntwitter = require("ntwitter");
var logfmt = require("logfmt");

app.use(logfmt.requestLogger());

//set up server routing
app.get("/", function(request, response) {
  var content = fs.readFileSync("template.html");
  getTweets(function(tweets) {
    var ul = "";
    tweets.forEach(function(tweet) {
      ul += "<li><strong>"+tweet.user.screen_name + " => </strong>"+tweet.text+"</li>";
    });

    content = content.toString('utf8').replace("{{INITIAL_TWEETS}}", ul);
    response.setHeader("Content-Type", 'text/html')
    response.send(content);
  });
});

//starts the server
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(port);


//initialize connection to database
var mongo = require("mongodb");
var host = '127.0.0.1'
var port = mongo.Connection.DEFAULT_PORT;
var db = new mongo.Db("nodejs-introduction", mongo.Server(host, port, {}));

var tweetCollection;

db.open(function(error) {
  console.log("You have successfully connected to the database at "+host+":"+port+"!");
  db.collection('tweet', function(error, collection) {
    tweetCollection = collection;
  });
});

//Render logic to display 10 most recent tweets
function getTweets (callback) {
  tweetCollection.find({}, {limit: 10, sort: {_id: -1}}, function(error, cursor) {
    cursor.toArray(function(error, tweets) {
      callback(tweets);
    });
  });
}

//logic to stream new tweets

fs.readFile('twitter_auth.json', function(auth_error, config) {
  var twitter_config = JSON.parse(config);
  var twitter = new ntwitter({
      consumer_key: twitter_config.consumer_key,
      consumer_secret: twitter_config.consumer_secret,
      access_token_key: twitter_config.access_token_key,
      access_token_secret: twitter_config.access_token_secret
  });

  twitter.verifyCredentials(function (err, data) {
    if (!err) {
      console.log(data.name + " has successfully been authenticated");
    }
  }).
  stream('statuses/filter', {track: 'Jon Kitna'}, function(stream) {
    stream.on('data', function(tweet) {
      io.sockets.emit('tweet', tweet);
      tweetCollection.insert(tweet, function(error) {
        if (error) {
          console.log("Oh no an error:", error);
        } else {
          console.log("Succesfully inserted tweet");
        }
      });
    });
  });
});
