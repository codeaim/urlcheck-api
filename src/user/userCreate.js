'use strict';

const pgp = require('pg-promise')();
const client = pgp(process.env.DATABASE_URL);

module.exports.handler = (event, context, callback) => {
        callback(null, {
            statusCode: 200,
            headers: {},
            body: ""
        });
};