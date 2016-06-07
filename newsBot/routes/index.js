var express = require('express');
var request = require('request');
var rssReader = require('feed-read');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'hello_token_success') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

router.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      // Handle a text message from this sender
      getArticles(function(err, articles) {
      		sendTextMessage(sender, articles[0])
      })
    }
  }
  res.sendStatus(200);
});

var token = process.env.TOKEN_VALUE;
var googleNewsEndpoint = "https://news.google.com/news?output=rss"

function getArticles(callback) {
	rssReader(googleNewsEndpoint, function(err, articles) {
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
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
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

module.exports = router;
