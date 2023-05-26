import { getCurieFromIRI } from "./prefix-mapping.js";
import { npo_partial_order, npo_neuron_meta, a_b_via_c } from "./sparql-queries.js";
import { executeDBQuery } from "./execute-query.js";
import { ClassEntity, AdjTableData, NeuronMetaData, AtoBviaC } from './utilities.js';

// Database and queries
const dbName = 'NPO';
//const dbName = 'sckan-explorer'; //from my localhost 
const qry1 = a_b_via_c;
const qry2 = npo_neuron_meta;
const qry3 = npo_partial_order;

export async function getPartialOrderDataFromDB(conn) {
    try {
        let queryResults = await executeDBQuery(conn, dbName, qry3);
        return queryResults;
    }
    catch (error) {
        console.error(error);
    }
}

export async function getNeuronsMetaDataFromDB(conn) {
    try {
        let queryResults = await executeDBQuery(conn, dbName, qry2);
        return queryResults;
    }
    catch (error) {
        console.error(error);
    }
}

export async function getABCDataFromDB(conn) {
    try {
        let queryResults = await executeDBQuery(conn, dbName, qry1);
        return queryResults;
    }
    catch (error) {
        console.error(error);
    }
}

export async function loadABCData(conn) {
    const neuronsMetaDataFromDB = await getNeuronsMetaDataFromDB(conn);
    const npo_neurons_metadata = getNeuronsMetaData(neuronsMetaDataFromDB);

    const poDataFromDB = await getPartialOrderDataFromDB(conn);
    let npo_poset = getNPOPartialOrders(poDataFromDB);

    const abc_data = await getABCDataFromDB(conn);
    const aToBviaC = getAtoBviaC(abc_data);
    return [aToBviaC, npo_poset];


    function getNPOPartialOrders(poData) {
        let npo_poset_data = [];
        for (let i = 0; i < poData.length; i++) {
            let neuron_iri = poData[i].Neuron_IRI.value;
            let neuron_id = getCurieFromIRI(neuron_iri);
            let neuron_label = poData[i].Neuron_Label.value;
            let neuronType =  {id: neuron_id, iri: neuron_iri, label: neuron_label};

            let v1IRI = poData[i].V1.value;
            let v1ID = getCurieFromIRI(v1IRI);
            let v1Label = poData[i].V1_Label.value;
            let v1 =  {id: v1ID, iri: v1IRI, label: v1Label};

            let v2IRI = poData[i].V2.value;
            let v2ID = getCurieFromIRI(v2IRI);
            let v2Label = poData[i].V2_Label.value;
            let v2 =  {id: v2ID, iri: v2IRI, label: v2Label};

            let poset = {neuron: neuronType, node1: v1, node2: v2};
            npo_poset_data.push(poset);
        }
        return npo_poset_data;
    }

    function getAtoBviaC(abc_data) {
        let abc = [];
        for (let i = 0; i < abc_data.length; i++) {
            let neuron_iri = abc_data[i].Neuron_ID.value;
            let neuron_id = getCurieFromIRI(neuron_iri);
            let neuronType =  ClassEntity(neuron_id, neuron_iri, null);

            let originIRI = abc_data[i].A_IRI.value;
            let originID = getCurieFromIRI(originIRI);
            let originLabel = abc_data[i].A_Label.value;
            let origin =  ClassEntity(originID, originIRI, originLabel);

            let destIRI = abc_data[i].B_IRI.value;
            let destID = getCurieFromIRI(destIRI);
            let destLabel = abc_data[i].B_Label.value;
            let dest =  ClassEntity(destID, destIRI, destLabel);


            let via = null;

            if (abc_data[i].hasOwnProperty("C_IRI")) {
                let viaIRI = abc_data[i].C_IRI.value;
                let viaID = getCurieFromIRI(viaIRI);
                let viaLabel = abc_data[i].C_Label.value;
                via =  ClassEntity(viaID, viaIRI, viaLabel);
            }

            let target_organ = null;

            if (abc_data[i].hasOwnProperty("Target_Organ_IRI")) {
                let targetOrganIRI = abc_data[i].Target_Organ_IRI.value;
                let targetOrganID = getCurieFromIRI(targetOrganIRI);
                let targetOrganLabel = abc_data[i].Target_Organ_Label.value;
                target_organ =  ClassEntity(targetOrganID, targetOrganIRI, targetOrganLabel);
            }

            let neuron_meta = npo_neurons_metadata.find(obj => obj.neuronID === neuron_id);

            let abcData = new AtoBviaC(neuronType, origin, dest, via, neuron_meta, target_organ);
            abc.push(abcData);
        }
        return abc;
    }

    function getNeuronsMetaData(neuronMetaData) {
        let neurons_meta = [];
        for (let i = 0; i < neuronMetaData.length; i++) {
            let neuron_iri = neuronMetaData[i].Neuron_IRI.value;
            let neuron_id = getCurieFromIRI(neuron_iri);

            let neuron_label = null;
            if (neuronMetaData[i].hasOwnProperty("Neuron_Label"))
                neuron_label = neuronMetaData[i].Neuron_Label.value;

            let neuron_sex = null;
            if (neuronMetaData[i].hasOwnProperty("Sex"))
                neuron_sex = neuronMetaData[i].Sex.value;

            let neuron_species = null;
            if (neuronMetaData[i].hasOwnProperty("Species"))
                neuron_species = neuronMetaData[i].Species.value;
                neuron_species = getPrefixesFromIRIs(neuron_species);


            let neuron_phenotypes = null;
            if (neuronMetaData[i].hasOwnProperty("Phenotypes"))
                neuron_phenotypes = neuronMetaData[i].Phenotypes.value;
                neuron_phenotypes = getPrefixesFromIRIs(neuron_phenotypes);


            let neuron_forward_connections = null;
            if (neuronMetaData[i].hasOwnProperty("Forward_Connections")) {
                neuron_forward_connections = neuronMetaData[i].Forward_Connections.value;
                neuron_forward_connections = getPrefixesFromIRIs(neuron_forward_connections);
            }

            let neuron_alert = null;
            if (neuronMetaData[i].hasOwnProperty("Alert"))
                neuron_alert = neuronMetaData[i].Alert.value;

            let neuron_reference = null;
            if (neuronMetaData[i].hasOwnProperty("Reference"))
                neuron_reference = neuronMetaData[i].Reference.value;

            let neuron_meta_data = new NeuronMetaData(neuron_id, neuron_label, neuron_species, neuron_sex,
                neuron_phenotypes, neuron_forward_connections,
                neuron_alert, neuron_reference);
            neurons_meta.push(neuron_meta_data);
        }
        return neurons_meta;
    }

    function getPrefixesFromIRIs(iriString) {
        const iris = iriString.split("|");

        const ret = [];
        for(let iri of iris) {
            if(!iri) {
                continue;
            }
            const ciri = getCurieFromIRI(iri);
            if (ciri) {
                ret.push(ciri);
            }
        }
        return ret;
    }

    function getStringAfterPipe(str) {
        let index = str.indexOf('|');
        if (index !== -1) {
            return str.slice(index + 1).trim();
        }
        return str.trim();
    }

}