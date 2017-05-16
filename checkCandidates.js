'use strict';

const pg = require('pg');

module.exports.checkCandidates = (event, context, callback) => {
    const region = JSON.parse(event.body).region;
    const client = new pg.Client(process.env.DATABASE_URL);
    const sql = `
        UPDATE "check"
        SET 
            state = 'ELECTED',
            locked = NOW() + INTERVAL '1 MINUTE'
        WHERE id IN (
            SELECT id
            FROM "check"
            WHERE
                disabled IS NULL
                AND ((state = 'WAITING' AND refresh <= NOW()) OR (state = 'ELECTED' AND locked <= NOW()))
                AND (confirming = FALSE OR region != '${region}')
        )
        RETURNING id, protocol, url, status, confirming;
    `;

    client.connect();

    console.log(`Querying ${process.env.DATABASE_URL} with sql ${sql} using client ${client}`);

    client.query(sql, [], (error, result) => {
        client.end();

        if (error) callback(error);

        const response = {
            "statusCode": 200,
            "headers": {},
            "body": JSON.stringify(result.rows)
        };

        console.log(`Returning rows ${response.body} for region ${region}`);

        callback(null, response);
    });
};
