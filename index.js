'use strict';

const pg = require('pg');

module.exports.candidate = (event, context, callback) => {
    const client = new pg.Client(process.env.DATABASE_URL);
    const requestBody = JSON.parse(event.body);
    const sql = `
        UPDATE "check"
        SET state = 'ELECTED', locked = NOW() + '1 MINUTE'
        WHERE id IN (
            SELECT id
            FROM "check"
            WHERE
                disabled IS NULL
                AND ((state = 'WAITING' AND refresh <= NOW()) OR (state = 'ELECTED' AND locked <= NOW()))
                AND (confirming = FALSE OR region <> $1::text)
        )
        RETURNING id, username, name, protocol, url, status, confirming
    `;

    client.connect(() => {
        client.query(sql, [requestBody.region], (error, result) => {
            if (error) callback(error);

            client.end(function (error) {
                if (error) callback(error);

                const response = {
                    "statusCode": 200,
                    "headers": {},
                    "body": JSON.stringify(result.rows)
                };

                callback(null, response);
            });
        });
    });
};