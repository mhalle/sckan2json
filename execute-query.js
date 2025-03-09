
import stardogjs from 'stardog';

export async function executeDBQuery(conn, databaseName, queryString) {
    try {
        const response = await stardogjs.query.execute(
            conn,
            databaseName,
            queryString,
            'application/sparql-results+json',
            {
                reasoning: false,
                offset: 0,
            }
        );

        // Check if response and body exist
        if (!response || !response.body) {
            console.error('No response or empty body received from Stardog');
            return [];
        }

        // Check if results and bindings exist
        if (!response.body.results || !response.body.results.bindings) {
            console.error('Malformed response from Stardog - missing results or bindings');
            console.error('Response structure:', JSON.stringify(response.body));
            return [];
        }

        return response.body.results.bindings;
    } catch (error) {
        console.error('Error executing SPARQL query:', error.message);
        console.error('Query:', queryString.slice(0, 200) + '...');
        return [];
    }
}
