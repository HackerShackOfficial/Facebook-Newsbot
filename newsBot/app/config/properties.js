//properties.js
/** Facebook */
exports.facebook_token = process.env.TOKEN_VALUE;
exports.facebook_challenge = 'hello_token_success';
exports.facebook_message_endpoint = 'https://graph.facebook.com/v2.6/me/messages';

/** News */
exports.google_news_endpoint = "https://news.google.com/news?output=rss";

/** Wit.ai */
exports.wit_token = process.env.WIT_TOKEN;
exports.wit_endpoint = 'https://api.wit.ai/message?v=20160720&q=';