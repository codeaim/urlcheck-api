'use strict';

const pgp = require('pg-promise')();
const client = pgp(process.env.DATABASE_URL);

module.exports.handler = (event, context, callback) => {
    const username = event.pathParameters.username;
    const includeChecks = event.queryStringParameters !== null
        ? event.queryStringParameters.includeChecks
        : false;

    client.task((task) => task.batch(
        includeChecks
            ? [task.oneOrNone(getUserSql, {username}), task.manyOrNone(getChecksSql, {username})]
            : [task.oneOrNone(getUserSql, {username})]
    )).then((events) => {
        const user = events[0] !== null
            ? Object.assign(
                getUser(events[0]),
                includeChecks && events[1] !== null
                    ? getChecks(events[1])
                    : {}
              )
            : null;

        const response = createResponse(user);

        pgp.end();
        callback(null, response);
    }).catch(error => {
        pgp.end();
        callback(error);
    });
};

const createResponse = u => {
    return {
        statusCode: u !== null ? 200 : 404,
        headers: {},
        body: u !== null
            ? JSON.stringify(u)
            : ""
    };
};

const getUser = u => {
    return {
        username: u.username,
        admin: u.admin,
        credit: u.credit
    };
};

const getCheck = c => {
    return {
        id: c.id,
        name: c.name,
        url: c.url,
        protocol: c.protocol,
        interval: c.interval,
        status: c.status,
        disabled: c.disabled,
        headers: c.headers
    };
};

const getChecks = ch => {
    return {
        checks: ch.map((c) => getCheck(c))
    };
};

const getChecksSql = `
    SELECT
        id,
        name,
        url,
        protocol,
        interval,
        status,
        disabled,
        headers
    FROM "check"
    WHERE username = $[username]`;

const getUserSql = `
    SELECT
        username,
        admin,
        credit
    FROM "user"
    WHERE username = $[username]`;