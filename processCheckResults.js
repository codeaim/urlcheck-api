'use strict';

const pgp = require('pg-promise')();

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
            INSERT INTO change (check_id, status, status_code, region, created, confirmed)
                SELECT
                    :id,
                    :status,
                    :statusCode,
                    :region,
                    NOW(),
                    CASE WHEN
                        change.created > (NOW() - ("check".interval * INTERVAL '1 minute' * 2))
                        AND change.status_code = :statusCode
                        AND change.status = :status
                        AND change.region != :region
                    THEN TRUE
                    ELSE FALSE END
                FROM "check"
                INNER JOIN change ON change.check_id = :id
                WHERE
                    "check".id = :id
                    AND "check".status != :status
                    AND change.created = (SELECT max(change.created)
                        FROM change
                        WHERE change.check_id = "check".id);`;
            console.log(`Insert change ${checkResult.id} sql ${sql}`);
            return t.query(sql, {
                id: checkResult.id,
                status: checkResult.status,
                statusCode: checkResult.statusCode < 400 ? 'UP' : 'DOWN',
                region: checkResult.region
            });
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