//initialize required modules
var http = require('http')
var fs = require("fs");
var port = process.env.PORT || 5000;
var express = require("express")
var app = express();
var ntwitter = require("ntwitter");
var logfmt = require("logfmt");

app.use(logfmt.requestLogger());

//set up server routing
app.get("/", function(request, response) {
  var content = fs.readFileSync("template.html");
  content = content.toString('utf8').replace("{{INITIAL_TWEETS}}", ul);
  response.setHeader("Content-Type", 'text/html')
  response.send(content);
  // getTweets(function(tweets) {
  //   var ul = "";
  //   tweets.forEach(function(tweet) {
  //     ul += "<li><strong>"+tweet.user.screen_name + " => </strong>"+tweet.text+"</li>";
  //   });
  // });
});

//starts the server
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(port);


//initialize connection to database
// var mongo = require("mongodb");
// var host = '127.0.0.1'
// var port = mongo.Connection.DEFAULT_PORT;
// var db = new mongo.Db("nodejs-introduction", mongo.Server(host, port, {}));

// var tweetCollection;

// db.open(function(error) {
//   console.log("You have successfully connected to the database at "+host+":"+port+"!");
//   db.collection('tweet', function(error, collection) {
//     tweetCollection = collection;
//   });
// });

//Render logic to display 10 most recent tweets
function getTweets (callback) {
  tweetCollection.find({}, {limit: 10, sort: {_id: -1}}, function(error, cursor) {
    cursor.toArray(function(error, tweets) {
      callback(tweets);
    });
  });
}

//logic to stream new tweets
var twitter = new ntwitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

twitter.verifyCredentials(function (err, data) {
  if (!err) {
    console.log(data.name + " has successfully been authenticated");
  }
}).
stream('statuses/filter', {track: 'Jon Kitna'}, function(stream) {
  stream.on('data', function(tweet) {
    io.sockets.emit('tweet', tweet);
    // tweetCollection.insert(tweet, function(error) {
    //   if (error) {
    //     console.log("Oh no an error:", error);
    //   } else {
    //     console.log("Succesfully inserted tweet");
    //   }
    // });
  });
});

