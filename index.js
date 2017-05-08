'use strict';

const pg = require('pg');

module.exports.candidates = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const client = new pg.Client(process.env.DATABASE_URL);
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
        RETURNING id, username, name, url, status, confirming
    `;

    client.connect(() => {
        console.log([requestBody.region]);
        client.query(sql, [requestBody.region], (err, result) => {

            result.rows.map((candidate) => {
                console.log(candidate)
            });

            client.end(function (err) {
                callback(err);
            });
        });
    });
};