//api.js
var request = require('request');
var rssReader = require('feed-read');
var properties = require('../config/properties.js')

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
		  	// Handle a text message from this sender
		  	getArticles(function(err, articles) {
				if (err) {
					console.log(err);
				} else {
					sendTextMessage(sender, articles[0])
				}
			})
		}
	}
	res.sendStatus(200);
}

function getArticles(callback) {
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

function sendTextMessage(sender, article) {
  messageData = {
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
  request({
    url: properties.facebook_message_endpoint,
    qs: {access_token:properties.facebook_token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}