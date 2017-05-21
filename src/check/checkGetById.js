'use strict';

const pgp = require('pg-promise')();
const client = pgp(process.env.DATABASE_URL);

module.exports.handler = (event, context, callback) => {
    const checkId = event.pathParameters['check-id'];
    const includeChanges = event.queryStringParameters !== null
        ? event.queryStringParameters.includeChanges
        : false;
    const includeResponses = event.queryStringParameters !== null
        ? event.queryStringParameters.includeResponses
        : false;

    client.task((task) => task.batch(
        includeChanges && includeResponses
            ? [task.oneOrNone(getCheckSql, {checkId}), task.manyOrNone(getChangesSql, {checkId}), task.manyOrNone(getResponsesSql, {checkId})]
            : includeChanges
                ? [task.oneOrNone(getCheckSql, {checkId}), task.manyOrNone(getChangesSql, {checkId})]
                : includeResponses
                    ? [task.oneOrNone(getCheckSql, {checkId}), task.manyOrNone(getResponsesSql, {checkId})]
                    : [task.oneOrNone(getCheckSql, {checkId})]
    )).then((events) => {
        const check = events[0] !== null
            ? Object.assign(
                getCheck(events[0]),
                includeChanges
                    ? getChanges(events[1])
                    : {},
                includeResponses
                    ? getResponses(includeChanges ? events[2] : events[1])
                    : {}
              )
            : null;

        const response = createResponse(check);

        pgp.end();
        callback(null, response);
    }).catch(error => {
        pgp.end();
        callback(error);
    });
};

const createResponse = c => {
    return {
        statusCode: c !== null ? 200 : 404,
        headers: {},
        body: c !== null
            ? JSON.stringify(c)
            : ""
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

const getChanges = ch => {
    return {
        changes: ch.map((c) => getChange(c))
    };
};

const getChange = c => {
    return {
        status: c.status,
        statusCode: c.status_code,
        credit: c.created
    };
};

const getResponses = re => {
    return {
        responses: re.map((r) => getResponse(r))
    };
};

const getResponse = r => {
    return {
        duration: r.duration,
        region: r.region,
        created: r.created
    };
};

const getCheckSql = `
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
    WHERE id = $[checkId]`;

const getChangesSql = `
    SELECT
        status,
        status_code,
        created
    FROM change
    WHERE check_id = $[checkId]`;

const getResponsesSql = `
    SELECT
        duration,
        region,
        created
    FROM response
    WHERE check_id = $[checkId]`;