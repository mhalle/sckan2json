import { getCurieFromIRI } from "./prefix-mapping.js";
import { npo_partial_order, npo_neuron_meta, a_b_via_c } from "./sparql-queries.js";
import { executeDBQuery } from "./execute-query.js";

// Database and queries
const DB_NAME = 'NPO';

// Model categories mapping - these can't be derived from the database
const MODEL_CATEGORIES = {
    "bolew": "Bolser-Lewis Model of Defensive Breathing",
    "keast": "Keast Model of Bladder Innervation",
    "bromo": "SAWG Model of Bronchomotor Control",
    "sdcol": "SAWG Model of the Descending Colon",
    "pancr": "SAWG Model of the Pancreas",
    "splen": "SAWG Model of the Spleen",
    "sstom": "SAWG Model of the Stomach",
    "aacar": "UCLA Model of the Heart",
    "mmset2cn": "Cranial Nerve Connections",
    "femrep": "Female Reproductive System",
    "kidney": "Kidney Connections",
    "liver": "Liver Connections",
    "prostate": "Male Reproductive System (Prostate)",
    "semves": "Male Reproductive System (Seminal Vesicles)",
    "senmot": "Sensory-Motor Connections",
    "swglnd": "Sweat Gland Connections",
    "mmset1": "Uncategorized Connections (Set 1)",
    "mmset4": "Uncategorized Connections (Set 4)"
};

// Phenotype categorization - these can't be derived from the database
const PHENOTYPE_CATEGORIES = {
    "Parasympathetic phenotype": "ANS: Parasympathetic",
    "Pre ganglionic phenotype, Parasympathetic phenotype": "ANS: Parasympathetic Pre-Ganglionic",
    "Parasympathetic phenotype, Pre ganglionic phenotype": "ANS: Parasympathetic Pre-Ganglionic",
    "Post ganglionic phenotype, Parasympathetic phenotype": "ANS: Parasympathetic Post-Ganglionic",
    "Parasympathetic phenotype, Post ganglionic phenotype": "ANS: Parasympathetic Post-Ganglionic",
    "Sympathetic phenotype": "ANS: Sympathetic",
    "Pre ganglionic phenotype, Sympathetic phenotype": "ANS: Sympathetic Pre-Ganglionic",
    "Sympathetic phenotype, Pre ganglionic phenotype": "ANS: Sympathetic Pre-Ganglionic",
    "Post ganglionic phenotype, Sympathetic phenotype": "ANS: Sympathetic Post-Ganglionic",
    "Sympathetic phenotype, Post ganglionic phenotype": "ANS: Sympathetic Post-Ganglionic",
    "Enteric phenotype": "ANS: Enteric",
    "Sensory phenotype": "Circuit Role: Sensory",
    "Motor phenotype": "Circuit Role: Motor",
    "Intrinsic phenotype": "Circuit Role: Intrinsic",
    "Inhibitory phenotype": "Functional Circuit Role: Inhibitory",
    "Excitatory phenotype": "Functional Circuit Role: Excitatory",
    "Spinal cord ascending projection phenotype": "Projection: Spinal cord ascending projection phenotype",
    "Spinal cord descending projection phenotype": "Projection: Spinal cord descending projection phenotype",
    "Anterior projecting phenotype": "Projection: Anterior projecting",
    "Posterior projecting phenotype": "Projection: Posterior projecting",
    "Intestino fugal projection phenotype": "Projection: Intestino fugal projection phenotype"
};

export async function loadABCData(conn) {
    const neuronMetaDataIndex = {};
    const neuronMetadataQueryResults = await executeDBQuery(conn, DB_NAME, npo_neuron_meta);
    for (let n of neuronMetadataQueryResults) {
        const id = getCurieFromIRI(n.Neuron_IRI.value);
        
        // Determine neuron's model category (if applicable)
        let modelId = null;
        let modelCategory = null;
        
        if (id) {
            // Check if the ID contains any of our model prefixes
            for (const [prefix, category] of Object.entries(MODEL_CATEGORIES)) {
                if (id.toLowerCase().includes(prefix)) {
                    modelId = prefix;
                    modelCategory = category;
                    break;
                }
            }
        }
        
        // Process phenotypes with categorization
        const rawPhenotypes = n?.Phenotypes?.value ? n.Phenotypes.value.split(", ") : [];
        const phenotypeIds = getPrefixesFromIRIs(n?.Phenotypes?.value);
        
        // Create categorized phenotypes
        const categorizedPhenotypes = rawPhenotypes.map(p => {
            return PHENOTYPE_CATEGORIES[p] || p;
        });
        
        // Extract DOIs from reference string
        const referenceString = n?.Reference?.value || null;
        const referenceDoIs = extractDOIsFromReference(referenceString);
        
        // Ensure consistent return types for all fields that could be arrays or strings
        neuronMetaDataIndex[id] = {
            id,
            iri: n.Neuron_IRI.value,
            // String fields
            label: n?.Neuron_Label?.value || null,
            preferred_label: null,  // We don't have this in the basic query
            sex: n?.Sex?.value || null,
            alert: n?.Alert?.value || null,
            reference: referenceString,
            diagram_link: null,  // We don't have this in the basic query
            model_id: modelId,
            model_category: modelCategory,
            
            // Array fields - ensure these are always arrays
            species: getPrefixesFromIRIs(n?.Species?.value),
            phenotypes: phenotypeIds,
            categorized_phenotypes: categorizedPhenotypes || [],
            forward_connections: getPrefixesFromIRIs(n?.Forward_Connections?.value),
            
            // Handle citation from literatureCitation
            citation: getPrefixesFromIRIs(n?.Citations?.value),
            
            // Add extracted DOIs
            reference_dois: referenceDoIs.map(doi => doi.url)
        };
        
        // Add DOIs to the metadata so they can be added to labels dictionary
        neuronMetaDataIndex[id].reference_doi_data = referenceDoIs;
    }

    const aToBViaCQueryResults = await executeDBQuery(conn, DB_NAME, a_b_via_c);
    const aToBViaC = aToBViaCQueryResults.map(n => {
        const id = getCurieFromIRI(n.Neuron_ID.value);
        const abc = {
            neuron: {
                id,
                iri: n.Neuron_ID.value,
            },
            neuronMetaData: neuronMetaDataIndex[id],
            origin: {
                iri: n.A_IRI.value,
                id: getCurieFromIRI(n.A_IRI.value),
                label: n.A_Label.value
            },
            destination: {
                iri: n.B_IRI.value,
                id: getCurieFromIRI(n.B_IRI.value),
                label: n.B_Label.value
            }
        };

        if (n?.C_IRI) {
            abc.via = {
                iri: n.C_IRI.value,
                id: getCurieFromIRI(n.C_IRI.value),
                label: n.C_Label.value
            };
        }
        if (n?.Target_Organ_IRI) {
            abc.targetOrgan = {
                iri: n.Target_Organ_IRI.value,
                id: getCurieFromIRI(n.Target_Organ_IRI.value),
                label: n.Target_Organ_Label.value
            }
        }
        return abc;
    });

    const npoPartialOrderQueryResults = await executeDBQuery(conn, DB_NAME, npo_partial_order);
    const npoPoset = npoPartialOrderQueryResults.map(p => {
        // Extract node types (hasSomaLocation, hasAxonLocation, etc.)
        const node1Type = p?.V1_Type?.value || null;
        const node2Type = p?.V2_Type?.value || null;
        
        // Check if this is a synaptic connection
        const isSynaptic = p?.IsSynapse?.value === "YES";
        
        return {
            neuron: {
                iri: p.Neuron_IRI.value,
                id: getCurieFromIRI(p.Neuron_IRI.value),
                label: p.Neuron_Label.value
            },
            node1: {
                iri: p.V1.value,
                id: getCurieFromIRI(p.V1.value),
                label: p.V1_Label.value
            },
            node2: {
                iri: p.V2.value,
                id: getCurieFromIRI(p.V2.value),
                label: p.V2_Label.value
            },
            node1_type: node1Type,
            node2_type: node2Type,
            is_synaptic: isSynaptic
        };
    });

    return [aToBViaC, npoPoset];
}

function getPrefixesFromIRIs(iriString) {
    // Always return an array, even for null/undefined values
    if (!iriString) {
        return [];
    }

    const iris = iriString.split("|");

    const ret = [];
    for (let iri of iris) {
        if (!iri) {
            continue;
        }
        const ciri = getCurieFromIRI(iri);
        if (ciri) {
            ret.push(ciri);
        }
    }
    return ret;
}

// Extract DOI URLs from reference strings
function extractDOIsFromReference(referenceString) {
    if (!referenceString) {
        return [];
    }
    
    // Match DOI URLs of the format https://doi.org/10.xxxx/xxxxx
    const doiRegex = /https:\/\/doi\.org\/([0-9]+\.[0-9]+\/[^\s,]+)/g;
    let match;
    const dois = [];
    
    // Find all DOIs in the string
    while ((match = doiRegex.exec(referenceString)) !== null) {
        dois.push({
            url: match[0],
            doi: match[1]
        });
    }
    
    return dois;
}
