
import stardogjs from 'stardog';

export async function executeDBQuery(conn, databaseName, queryString)
{
    return await stardogjs.query.execute(
       conn,
       databaseName,
       queryString,
       'application/sparql-results+json',
       {
          reasoning: false,
          offset: 0,
       }
    ).then(({ body }) => body.results.bindings);
}
