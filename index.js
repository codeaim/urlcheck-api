'use strict';

const AWS = require("aws-sdk");
const pgp = require('pg-promise')();

module.exports.checkCandidates = (event, context, callback) => {
    const client = pgp(process.env.DATABASE_URL);
    const requestBody = JSON.parse(event.body);
    const sql = `
        UPDATE "check"
        SET 
            state = 'ELECTED',
            locked = NOW() + '1 MINUTE'
        WHERE id IN (
            SELECT id
            FROM "check"
            WHERE
                disabled IS NULL
                AND ((state = 'WAITING' AND refresh <= NOW()) OR (state = 'ELECTED' AND locked <= NOW()))
                AND (confirming = FALSE OR region != '${requestBody.region}')
        )
        RETURNING id, protocol, url
    `;

    console.log(`Check candidates for region ${requestBody.region} sql ${sql}`);
    client.manyOrNone(sql)
        .then((result) => {
            const response = {
                "statusCode": 200,
                "headers": {},
                "body": JSON.stringify(result)
            };

            console.log(`Returning rows ${JSON.stringify(result)} for region ${requestBody.region}`);

            callback(null, response);
        })
        .catch(error => {
            callback(error);
        });
};

module.exports.checkResults = (event, context, callback) => {
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
                "statusCode": 202,
                "headers": {},
                "body": ""
            };

            callback(null, response);
        });
};

module.exports.processCheckResults = (event, context, callback) => {
    const client = pgp(process.env.DATABASE_URL);
    const checkResults = JSON.parse(event.Records[0].Sns.Message);
    console.log(`Processing check results: ${JSON.stringify(checkResults)}`);

    client.tx(t => {
        const sql = `
            INSERT INTO response (check_id, duration, region, created)
            VALUES ${checkResults.map((checkResult) => `('${checkResult.id}', ${checkResult.responseTime}, '${checkResult.region}', now())`).join(', ')}`;
        const responseInsertBatch = t.query(sql);
        console.log(`Insert responses sql ${sql}`);

        const changeInserts = checkResults.map((checkResult) => {
            const status = checkResult.statusCode < 400 ? 'UP' : 'DOWN';
            const sql = `
            INSERT INTO change (check_id, status, status_code, created)
            SELECT 
                '${checkResult.id}',
                '${status}',
                ${checkResult.statusCode},
                now()
            FROM "check"
            WHERE id = '${checkResult.id}'
                AND status != '${checkResult.statusCode < 400 ? 'UP' : 'DOWN'}'
                AND confirming = true;`;
            console.log(`Insert change ${checkResult.id} sql ${sql}`);
            return t.query(sql);
        });

        const updateChecks = checkResults.map((checkResult) => {
            const status = checkResult.statusCode < 400 ? 'UP' : 'DOWN';
            const sql = `
            UPDATE "check"
            SET
                state  = 'WAITING',
                locked = NULL,
                region = '${checkResult.region}',
                status = CASE WHEN confirming THEN '${status}' ELSE status END,
                refresh = CASE  WHEN status = '${status}' AND confirming = false THEN (now() + ("interval" * interval '1 minute'))
                                WHEN status = '${status}' AND confirming = true THEN (now() + (interval '30 seconds'))
                                WHEN status != '${status}' AND confirming = false THEN refresh
                                WHEN status != '${status}' AND confirming = true THEN (now() + ("interval" * interval '1 minute')) END,
                confirming = status != '${status}' AND confirming = false,
                modified = now(),
                version = version + 1
            WHERE id = '${checkResult.id}';`;
            console.log(`Update ${checkResult.id} sql ${sql}`);
            return t.query(sql);
        });

        return t.batch([responseInsertBatch, ...changeInserts, ...updateChecks]);
    }).then(data => {
        console.log(`data: ${JSON.stringify(data)}`);
    }).catch(error => {
        console.log(`error: ${JSON.stringify(error)}`);
        callback(error);
    });
};