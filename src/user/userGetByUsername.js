'use strict';

const pg = require('pg');
const AWS = require("aws-sdk");

module.exports.handler = (event, context, callback) => {

        const response = {
            statusCode: 200,
            headers: {},
            body: JSON.stringify({
                id: "hello"
            })
        };

        callback(null, response);
};
