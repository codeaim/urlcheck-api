'use strict';

module.exports.tweet = (event, context, callback) => {
	const Twitter = require('twitter');

	const client = new Twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	});

	const params = {
		screen_name: 'etdrivingschool'
	}

	client.get('statuses/user_timeline', params, function(error, tweets, response) {
		if (error) {
			console.log(error);
			callback(error);
		}

		const result = {
			"statusCode": 200,
			"headers": {},
			"body": JSON.stringify(tweets)
		};
		callback(null, result);
	});
};

module.exports.contact = (event, context, callback) => {
	const requestBody = JSON.parse(event.body);
	const mailgun = require('mailgun-js')({
		apiKey: process.env.MAILGUN_API_KEY,
		domain: process.env.MAILGUN_DOMAIN
	});

	const data = {
		from: 'ET Driving School Contact Form <admin@codeaim.com>',
		to: 'gdownes@gmail.com',
		subject: `${requestBody.title} (${requestBody.email})`,
		text: requestBody.message
	};

	mailgun.messages().send(data, function(error, body) {
		if (error) {
			console.log(error);
			callback(error);
		}

		const result = {
			"statusCode": 201,
			"headers": {},
			"body": ''
		}
		callback(null, result);
	});
};