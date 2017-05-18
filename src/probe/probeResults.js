'use strict';

const AWS = require("aws-sdk");

module.exports.handler = (event, context, callback) => {
    const topic = process.env.RESULTS_TOPIC;
    const requestBody = JSON.parse(event.body);

    const checkResults = JSON.stringify(requestBody);
    console.log(`Publishing ${checkResults} to ${topic}`);

    new AWS.SNS().publish(
        {
            Message: checkResults,
            TopicArn: topic
        },
        (error) => {
            if (error) callback(error);

            const response = {
                statusCode: 202,
                headers: {},
                body: ""
            };

            callback(null, response);
        });
};