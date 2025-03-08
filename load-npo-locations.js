// To load all the locations based on NPO's locational phenotypes for its neuron types. 
import { executeDBQuery } from "./execute-query.js";
import { npo_all_locations, npo_synonyms } from "./sparql-queries.js";
import { getCurieFromIRI } from "./prefix-mapping.js";

const databaseName = 'NPO';
export async function getNPOLocations(conn) {
    try {
        var queryResults = await executeDBQuery(conn, databaseName, npo_all_locations);
        return queryResults;
    }
    catch (error) {
        console.error(error);
    }
}

export async function getNPOSynonyms(conn) {
    try {
        var queryResults = await executeDBQuery(conn, databaseName, npo_synonyms);
        return queryResults;
    }
    catch (error) {
        console.error(error);
    }
}

export async function loadNPOSynonyms(conn) {
    const data = await getNPOSynonyms(conn);
    const entities = [];
    for(let d of data) {
        const iri = d.Location_IRI.value;
        entities.push({
            iri: iri,
            id: getCurieFromIRI(iri),
            label: d.Location_Label.value
        })
    }
    return entities;
}

export async function loadAllLocations(conn) {
    const data = await getNPOLocations(conn);

    const connectionTypeLookup = {
        "ilxtr:hasSomaLocation": 'soma',
        "ilxtr:hasAxonLocation": 'via',
        "ilxtr:hasAxonTerminalLocation": 'terminal',
        "ilxtr:hasAxonSensoryLocation": 'sensory'
    };

    const entities = [];
    for (let d of data) {
        let connection_id = getCurieFromIRI(d.Connection_Type.value);
        let connection_type = connectionTypeLookup[connection_id] || null;
        let location_label = d.Location_Label.value;
        let location_IRI = d.Location_IRI.value;
        let location_ID = getCurieFromIRI(location_IRI);

        entities.push({
            id: location_ID,
            iri: location_IRI,
            label: location_label,
            connection_type,
            connection_id
        });
    }
    return entities;
}
