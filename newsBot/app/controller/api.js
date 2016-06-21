//api.js
var request = require('request');
var rssReader = require('feed-read');
var properties = require('../config/properties.js')

// if our user.js file is at app/models/user.js
var User = require('../model/user');

exports.tokenVerification = function(req, res) {
	if (req.query['hub.verify_token'] === properties.facebook_challenge) {
    res.send(req.query['hub.challenge']);
  } else {
  	res.send('Error, wrong validation token');
  }
}

exports.handleMessage = function(req, res) {
	messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {
		event = req.body.entry[0].messaging[i];
		sender = event.sender.id;
		if (event.message && event.message.text) {
		  	text = event.message.text;

        normalizedText = text.toLowerCase().replace(' ', '');
        
		  	// Handle a text message from this sender
        switch(normalizedText) {
          case "/subscribe":
            subscribeUser(sender)
            break;
          case "/unsubscribe":
            unsubscribeUser(sender)
            break;
          case "/subscribestatus":
            subscribeStatus(sender)
            break;
          default:
            _getArticles(function(err, articles) {
              if (err) {
                console.log(err);
              }
              else if (normalizedText == "showmore") {
                maxArticles = Math.min(articles.length, 5);
                for (var i=0; i<maxArticles; i++) {
                  _sendArticleMessage(sender, articles[i])
                }
              } else {
                _sendArticleMessage(sender, articles[0])
              }
             })
          }
  		}
    }
	res.sendStatus(200);
}

function subscribeUser(id) {
  // create a new user called chris
  var newUser = new User({
    fb_id: id,
  });

  // call the built-in save method to save to the database
  User.findOneAndUpdate({fb_id: newUser.fb_id}, {fb_id: newUser.fb_id}, {upsert:true}, function(err, user) {
    if (err) {
      sendTextMessage(id, "There wan error subscribing you for daily articles");
    } else {
      console.log('User saved successfully!');
      sendTextMessage(newUser.fb_id, "You've been subscribed!")
    }
  });
}

function unsubscribeUser(id) {
  // call the built-in save method to save to the database
  User.findOneAndRemove({fb_id: id}, function(err, user) {
    if (err) {
      sendTextMessage(id, "There wan error unsubscribing you for daily articles");
    } else {
      console.log('User deleted successfully!');
      sendTextMessage(id, "You've been unsubscribed!")
    }
  });
}

function subscribeStatus(id) {
  User.findOne({fb_id: id}, function(err, user) {
    subscribeStatus = false
    if (err) {
      console.log(err)
    } else {
      if (user != null) {
        subscribeStatus = true
      }
      subscribedText = "Your subscribed status is " + subscribeStatus
      sendTextMessage(id, subscribedText)
    }
  })
}

function _getArticles(callback) {
  rssReader(properties.google_news_endpoint, function(err, articles) {
    if (err) {
      callback(err)
    } else {
      if (articles.length > 0) {
        callback(null, articles)
      } else {
        callback("no articles received")
      }
    }
  })
}

exports.getArticles = function(callback) {
	_getArticles(callback)
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: properties.facebook_message_endpoint,
    qs: { access_token: properties.facebook_token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.log(response.statusCode)
      console.error("Unable to send message.");
      //console.error(response);
      console.error(error);
    }
  });  
}

function _sendArticleMessage(sender, article) {
  messageData = {
    recipient: {
      id: sender
    },
    message: {
    attachment:{
          type:"template",
          payload:{
            template_type:"generic",
            elements:[
              {
                title:article.title,
                subtitle: article.published.toString(),
                item_url:article.link
                }
        ]
        }
        }
      }
  }
  
  callSendAPI(messageData)
}

exports.sendArticleMessage = function(sender, article) {
  _sendArticleMessage(sender, article)
}