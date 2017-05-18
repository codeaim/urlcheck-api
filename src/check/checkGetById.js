'use strict';

const pg = require('pg');

module.exports.handler = (event, context, callback) => {
    const checkId = JSON.parse(event.body)['check-id'];
    console.log(checkId);
    const response = {
        statusCode: 200,
        headers: {},
        body: JSON.stringify({
            id: "hello"
        })
    };

    callback(null, response);
};
