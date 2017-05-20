'use strict';

const pgp = require('pg-promise')();
const client = pgp(process.env.DATABASE_URL);

module.exports.handler = (event, context, callback) => {
    const checkResults = JSON.parse(event.Records[0].Sns.Message);
    console.log(`Processing check results: ${JSON.stringify(checkResults)}`);

    const confirmed = checkResults
        .filter((checkResult) => checkResult.status !== checkResult.previousStatus && checkResult.confirming)
        .map((checkResult) => checkResult.id);

    const unconfirmed = checkResults
        .filter((checkResult) => checkResult.status !== checkResult.previousStatus && !checkResult.confirming)
        .map((checkResult) => checkResult.id);

    client.tx(t => {
        const responseInsertBatchSql = `
            INSERT INTO response (check_id, duration, region, created)
            VALUES ${checkResults.map((checkResult) => `('${checkResult.id}', ${checkResult.responseTime}, '${checkResult.region}', now())`).join(', ')};`;

        const changeInsertBatchSql = `
            INSERT INTO change (check_id, status, status_code, created)
            VALUES ${checkResults.filter((checkResult) => checkResult.status !== checkResult.previousStatus && checkResult.confirming).map((checkResult) => `('${checkResult.id}', '${checkResult.status}', ${checkResult.statusCode}, now())`).join(', ')};`;

        const checkUpdateSql = `
            UPDATE "check"
            SET
                status = CASE WHEN "check".id IN ('${confirmed.join('\', \'')}') THEN change.status ELSE "check".status END,
                state = 'WAITING',
                modified = NOW(),
                refresh = CASE WHEN "check".id IN ('${unconfirmed.join('\', \'')}') THEN NOW() ELSE (NOW() + ("check".interval * interval '1 minute')) END,
                locked = NULL,
                version = "check".version + 1,
                confirming = "check".id IN ('${unconfirmed.join('\', \'')}'),
                region = response.region,
                disabled = CASE WHEN "user".credit <= 1 THEN NOW() ELSE NULL END
            FROM "check" c
            INNER JOIN "user" ON c.username = "user".username
            LEFT JOIN change ON c.id = change.check_id
            INNER JOIN response ON c.id = response.check_id
            WHERE "check".id IN ('${checkResults.map((checkResult) => checkResult.id).join('\', \'')}')
            AND "check".id = c.id
            AND response.created = (SELECT max(response.created) FROM response WHERE response.check_id = "check".id)
            AND (change.created = (SELECT max(change.created) FROM change WHERE change.check_id = "check".id) OR change.created IS NULL);`;

        console.log(`Insert responses sql: ${responseInsertBatchSql}`);
        if(confirmed.length > 0)  console.log(`Insert changes sql: ${changeInsertBatchSql}`);
        console.log(`Update checks sql: ${checkUpdateSql}`);

        return t.batch(confirmed.length > 0
            ? [t.query(responseInsertBatchSql), t.query(changeInsertBatchSql), t.query(checkUpdateSql)]
            : [t.query(responseInsertBatchSql), t.query(checkUpdateSql)]);
    }).then(() => {
        pgp.end();
        console.log("Processed check results");
        callback();
    }).catch((error) => {
        pgp.end();
        callback(error);
    });
};