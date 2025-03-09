import * as dotenv from 'dotenv';
import stardogjs from 'stardog';
import { loadAllLocations, loadNPOSynonyms } from './load-npo-locations.js';
import { loadABCData } from './load-abc.js';


// Function to add labels to the label lookup dictionary
// Labels dictionary should ONLY contain IRI and label mappings
function addLabel(labels, obj, idattr = 'id', iriattr = 'iri', labelattr = 'label') {
   if (obj) {
      labels[obj[idattr]] = labels[obj[idattr]] || {};
      labels[obj[idattr]][iriattr] = obj[iriattr];
      labels[obj[idattr]][labelattr] = obj[labelattr];
   }
   return labels;
}

async function main() {
   dotenv.config();

   const ConnectionInfo = {
      username: process.env.SCKAN_USERNAME || 'SPARC',
      password: process.env.SCKAN_PASSWORD, 
      endpoint: process.env.SCKAN_ENDPOINT || 'https://stardog.scicrunch.io:5821'
   }
   
   const conn = new stardogjs.Connection(ConnectionInfo);

   const labels = {};
   
   // Add mappings for node types to labels dictionary
   labels["hasSomaLocation"] = { 
      iri: "http://uri.interlex.org/tgbugs/uris/readable/hasSomaLocation", 
      label: "soma" 
   };
   labels["hasAxonLocation"] = { 
      iri: "http://uri.interlex.org/tgbugs/uris/readable/hasAxonLocation", 
      label: "axon" 
   };
   labels["hasAxonLeadingToSensoryTerminal"] = { 
      iri: "http://uri.interlex.org/tgbugs/uris/readable/hasAxonLeadingToSensoryTerminal", 
      label: "axon to sensory" 
   };
   labels["hasSensoryAxonTerminalLocation"] = { 
      iri: "http://uri.interlex.org/tgbugs/uris/readable/hasSensoryAxonTerminalLocation", 
      label: "sensory terminal" 
   };
   labels["hasAxonTerminalLocation"] = { 
      iri: "http://uri.interlex.org/tgbugs/uris/readable/hasAxonTerminalLocation", 
      label: "axon terminal" 
   };
   const locations = await loadAllLocations(conn);
   const synonyms = await loadNPOSynonyms(conn);
   const abc_segments = await loadABCData(conn);
   const [abc, segments] = abc_segments;

   // Create an object to collect all DOI metadata
   const doiMetadata = {};
   
   const ret = {
      metadata: {
         query_date: new Date().toJSON(),
         version: "2.0",
         description: "Enhanced SCKAN data with additional metadata",
         json_schema: {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "SCKAN JSON Format",
            "type": "object",
            "properties": {
               "metadata": {
                  "type": "object",
                  "description": "Metadata about this data export, including version and documentation",
                  "properties": {
                     "query_date": { 
                        "type": "string", 
                        "format": "date-time",
                        "description": "The date and time when this data was exported from the database" 
                     },
                     "version": { 
                        "type": "string",
                        "description": "Version of the data format" 
                     },
                     "description": { 
                        "type": "string",
                        "description": "Human-readable description of this data export" 
                     },
                     "json_schema": { 
                        "type": "object",
                        "description": "JSON Schema definition for this data format" 
                     },
                     "documentation": { 
                        "type": "string",
                        "description": "Extended documentation of all fields and how to use them" 
                     }
                  },
                  "required": ["query_date", "version"]
               },
               "neural_connectivity": {
                  "type": "array",
                  "description": "Array of neural connectivity records representing connections between anatomical locations",
                  "items": {
                     "type": "object",
                     "description": "A single neural connectivity record",
                     "properties": {
                        "id": { 
                           "type": "string",
                           "description": "Unique identifier (CURIE) for the neuron" 
                        },
                        "origin": { 
                           "type": "string",
                           "description": "CURIE of the origin/source anatomical location" 
                        },
                        "via": { 
                           "type": "string",
                           "description": "CURIE of the intermediate anatomical location (if applicable)" 
                        },
                        "destination": { 
                           "type": "string",
                           "description": "CURIE of the destination/target anatomical location" 
                        },
                        "target_organ": { 
                           "type": "string",
                           "description": "CURIE of the target organ (if applicable)" 
                        }
                     },
                     "required": ["id"]
                  }
               },
               "neuron_metadata": {
                  "type": "object",
                  "description": "Dictionary of neuron metadata indexed by neuron ID",
                  "additionalProperties": {
                     "type": "object",
                     "description": "Metadata for a single neuron record",
                     "properties": {
                        "label": { 
                           "type": "string",
                           "description": "Human-readable label for the neuron" 
                        },
                        "preferred_label": { 
                           "type": "string",
                           "description": "Preferred display label for the neuron (if different from the standard label)" 
                        },
                        "sex": { 
                           "type": "string",
                           "description": "Sex specification for the neuron (e.g., male, female, both)" 
                        },
                        "alert": { 
                           "type": "string",
                           "description": "Alert notes or warnings about this neuron data" 
                        },
                        "reference": { 
                           "type": "string",
                           "description": "Full reference text for the source of this neuron data" 
                        },
                        "diagram_link": { 
                           "type": "string",
                           "description": "URL to a diagram illustrating this neuron's connectivity" 
                        },
                        "model_id": { 
                           "type": "string",
                           "description": "Model identifier (e.g., 'bolew', 'keast') that categorizes this neuron" 
                        },
                        "model_category": { 
                           "type": "string",
                           "description": "Human-readable model category (e.g., 'Keast Model of Bladder Innervation')" 
                        },
                        "species": { 
                           "type": "array", 
                           "description": "Array of species in which this neuron is observed",
                           "items": { 
                             "type": "string",
                             "description": "Species name" 
                           } 
                        },
                        "phenotypes": { 
                           "type": "array", 
                           "description": "Array of raw phenotype strings from the database",
                           "items": { 
                             "type": "string",
                             "description": "Phenotype string (e.g., 'Intrinsic phenotype')" 
                           } 
                        },
                        "categorized_phenotypes": { 
                           "type": "array", 
                           "description": "Array of human-readable phenotype categories",
                           "items": { 
                             "type": "string",
                             "description": "Categorized phenotype (e.g., 'Circuit Role: Intrinsic')" 
                           } 
                        },
                        "forward_connections": { 
                           "type": "array", 
                           "description": "Array of forward neural connections (target neuron CURIEs)",
                           "items": { 
                             "type": "string",
                             "description": "CURIE of a target neuron" 
                           } 
                        },
                        "citation": { 
                           "type": "array", 
                           "description": "Array of citation references",
                           "items": { 
                             "type": "string",
                             "description": "Citation reference CURIE" 
                           } 
                        },
                        "reference_dois": { 
                           "type": "array", 
                           "description": "Array of DOI URLs extracted from references",
                           "items": { 
                             "type": "string",
                             "description": "DOI URL (e.g., 'https://doi.org/10.1234/5678')" 
                           } 
                        }
                     }
                  }
               },
               "neural_segments": {
                  "type": "array",
                  "description": "Array of ordered neuron pathway segments showing anatomical connections",
                  "items": {
                     "type": "object",
                     "description": "A single neural pathway segment for a specific neuron",
                     "properties": {
                        "id": { 
                           "type": "string",
                           "description": "CURIE of the neuron" 
                        },
                        "nodes": {
                           "type": "array",
                           "description": "Ordered array of connection nodes forming a pathway",
                           "items": {
                              "type": "object",
                              "description": "A location node in the neural pathway",
                              "properties": {
                                 "id": { 
                                    "type": "string",
                                    "description": "CURIE of the anatomical location" 
                                 },
                                 "type": { 
                                    "type": "string",
                                    "description": "Node type (e.g., 'hasSomaLocation', 'hasAxonLocation')" 
                                 }
                              },
                              "required": ["id"]
                           }
                        },
                        "is_synaptic": { 
                           "type": "boolean",
                           "description": "Boolean indicating if this is a synaptic connection" 
                        }
                     },
                     "required": ["id", "nodes"]
                  }
               },
               "locations": {
                  "type": "array",
                  "description": "Array of anatomical locations used in neural connectivity",
                  "items": {
                     "type": "object",
                     "description": "A single anatomical location record",
                     "properties": {
                        "id": { 
                           "type": "string",
                           "description": "CURIE of the anatomical location" 
                        },
                        "location_type": { 
                           "type": "string",
                           "description": "Type categorization (soma, axon, terminal, sensory)" 
                        },
                        "connection_type": { 
                           "type": "string",
                           "description": "Connection type ID for this location" 
                        }
                     },
                     "required": ["id"]
                  }
               },
               "labels": {
                  "type": "object",
                  "description": "Dictionary mapping IDs to IRIs and human-readable labels",
                  "additionalProperties": {
                     "type": "object",
                     "description": "Label information for a single ID",
                     "properties": {
                        "iri": { 
                           "type": "string",
                           "description": "Full IRI (URI reference) for this ID" 
                        },
                        "label": { 
                           "type": "string",
                           "description": "Human-readable label for this ID" 
                        },
                        "synonyms": {
                           "type": "array",
                           "description": "Array of alternative labels or synonyms",
                           "items": { 
                              "type": "string",
                              "description": "Alternative label or synonym" 
                           }
                        }
                     },
                     "required": ["iri", "label"]
                  }
               },
               "doi_metadata": {
                  "type": "object",
                  "description": "Dictionary of DOI information extracted from references",
                  "additionalProperties": {
                     "type": "object",
                     "description": "Metadata for a single DOI reference",
                     "properties": {
                        "doi": { 
                           "type": "string",
                           "description": "The DOI number (e.g., '10.1159/000060678')" 
                        },
                        "label": { 
                           "type": "string",
                           "description": "The citation text from the reference containing this DOI" 
                        }
                     },
                     "required": ["doi"]
                  }
               }
            },
            "required": ["metadata", "neural_connectivity", "neuron_metadata", "neural_segments", "locations", "labels"]
         },
         documentation: `
SCKAN2JSON File Format Documentation:

1. neural_connectivity: Array of neuron connectivity records
   - id: Neuron ID
   - origin: Origin location ID
   - via: Via/intermediate location ID (optional)
   - destination: Destination location ID
   - target_organ: Target organ ID (optional)

2. neuron_metadata: Dictionary of neuron metadata indexed by neuron ID
   - label: Human-readable label
   - preferred_label: Preferred display label (optional)
   - species: Array of species this neuron is observed in
   - sex: Sex specification (can be null)
   - phenotypes: Array of phenotype IDs
   - categorized_phenotypes: Array of human-readable phenotype categories
   - forward_connections: Array of forward neural connections
   - model_id: Model identifier (e.g., "bolew", "keast")
   - model_category: Human-readable model category
   - alert: Alert notes (optional)
   - reference: Full reference text (optional)
   - reference_dois: Array of DOI URLs extracted from references
   - diagram_link: URL to diagram (optional)
   - citation: Array of citation references

3. neural_segments: Array of ordered neuron pathway segments
   - id: Neuron ID
   - nodes: Array of connection nodes, each containing:
     - id: Location ID
     - type: Node type (e.g., "hasSomaLocation", "hasAxonLocation")
   - is_synaptic: Boolean indicating if this is a synaptic connection

4. locations: Array of anatomical locations
   - id: Location ID
   - location_type: Type categorization (soma, axon, terminal, sensory)
   - connection_type: Connection type ID

5. labels: Dictionary mapping IDs to IRIs and labels
   - For each ID, contains:
     - iri: Full IRI (URI reference)
     - label: Human-readable label
     - synonyms: Array of alternative labels/synonyms (if available)

6. doi_metadata: Dictionary of DOI information extracted from references
   - For each DOI URL, contains:
     - doi: The DOI number (e.g., "10.1159/000060678")
     - label: The citation text from the reference

How to use labels:
- The labels dictionary maps IDs to their readable labels and IRIs
- To get a human-readable label for any ID in the data:
  1. Look up the ID in the labels dictionary: labels[id].label
  2. For neuron types (hasSomaLocation, etc.), use the predefined mappings
- Example: to get the label for a location with id "NPO:12345":
  const locationLabel = labels["NPO:12345"]?.label || "Unknown"
         `
      }
   };
   // abc comme
   ret.neural_connectivity = abc.map(x => {
      const conn = { id: x.neuron?.id };
      if (x.origin?.id) conn.origin = x.origin.id;
      if (x.destination?.id) conn.destination = x.destination.id;
      if (x.via?.id) conn.via = x.via.id;
      if (x.targetOrgan?.id) conn.target_organ = x.targetOrgan.id;
      return conn;
   })

   // abc neuron metadata

   ret.neuron_metadata = {};
   abc.forEach((x) => {
      const meta = x.neuronMetaData;
      // Create neuron metadata object without null values
      const neuronMeta = {};
      
      // Add string fields only if they have values
      if (meta.label) neuronMeta.label = meta.label;
      if (meta.preferred_label) neuronMeta.preferred_label = meta.preferred_label;
      if (meta.sex) neuronMeta.sex = meta.sex;
      if (meta.alert) neuronMeta.alert = meta.alert;
      if (meta.reference) neuronMeta.reference = meta.reference;
      if (meta.diagram_link) neuronMeta.diagram_link = meta.diagram_link;
      if (meta.model_id) neuronMeta.model_id = meta.model_id;
      if (meta.model_category) neuronMeta.model_category = meta.model_category;
      
      // Add array fields only if they have items
      if (meta.species && meta.species.length > 0) neuronMeta.species = meta.species;
      if (meta.phenotypes && meta.phenotypes.length > 0) neuronMeta.phenotypes = meta.phenotypes;
      if (meta.categorized_phenotypes && meta.categorized_phenotypes.length > 0) neuronMeta.categorized_phenotypes = meta.categorized_phenotypes;
      if (meta.forward_connections && meta.forward_connections.length > 0) neuronMeta.forward_connections = meta.forward_connections;
      if (meta.citation && meta.citation.length > 0) neuronMeta.citation = meta.citation;
      if (meta.reference_dois && meta.reference_dois.length > 0) neuronMeta.reference_dois = meta.reference_dois;
      
      ret.neuron_metadata[meta.id] = neuronMeta;
      
      // Add DOIs to the doi_metadata object
      if (meta.reference_doi_data && meta.reference_doi_data.length > 0) {
         meta.reference_doi_data.forEach(doi => {
            // Use the DOI URL as the ID
            const doiUrl = doi.url;
            
            // Add to doi_metadata, skipping empty fields
            doiMetadata[doiUrl] = {
               doi: doi.doi  // The DOI number
            };
            // Only add label if it's not empty
            if (doi.label && doi.label.trim() !== "") {
               doiMetadata[doiUrl].label = doi.label;
            }
         });
      }
   });

   // collect node labels and IRIs in a lookup table
   for (let x of abc) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.origin);
      addLabel(labels, x.via);
      addLabel(labels, x.destination);
      addLabel(labels, x.targetOrgan);

      // If there's a preferred label, use it in the labels dictionary
      if (x.neuron?.id && x.neuronMetaData?.preferred_label) {
         labels[x.neuron.id].label = x.neuronMetaData.preferred_label;
      }
      // Otherwise use the regular label
      else if (x.neuron?.id && x.neuronMetaData?.label) {
         labels[x.neuron.id].label = x.neuronMetaData.label;
      }
   }

   ret.neural_segments = segments.map(x => {
      const seg = { id: x.neuron?.id };
      
      // Create array of nodes with non-null values
      const nodes = [];
      
      if (x.node1?.id) {
         const node1 = { id: x.node1.id };
         if (x.node1_type) node1.type = x.node1_type;
         nodes.push(node1);
      }
      
      if (x.node2?.id) {
         const node2 = { id: x.node2.id };
         if (x.node2_type) node2.type = x.node2_type;
         nodes.push(node2);
      }
      
      seg.nodes = nodes;
      
      // Only include is_synaptic if it's true
      if (x.is_synaptic) seg.is_synaptic = true;
      
      return seg;
   });

   // Add segment labels to the labels dictionary (only IRI and label mappings)
   for (let x of segments) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.node1);
      addLabel(labels, x.node2);
   }

   // Enhanced locations with more detailed type information, skipping null fields
   ret.locations = Array.from(
      new Set(locations.map(x => {
         const loc = { id: x.id };
         if (x.connection_type) loc.location_type = x.connection_type;
         if (x.connection_id) loc.connection_type = x.connection_id;
         return loc;
      }))
   );
   
   // Since node types are now included in the segments.nodes array,
   // we don't need a separate node_types dictionary

   // Add locations to the labels dictionary (only IRI and label mappings)
   for (let loc of locations) {
      if (loc.id) {
         addLabel(labels, loc);
      }
   }

   // Add synonyms to the labels dictionary instead of creating a separate section
   for (let syn of synonyms) {
      if (syn.id) {
         // If this ID is already in the labels dictionary
         if (labels[syn.id]) {
            // Add the synonym to the synonyms array (create if needed)
            labels[syn.id].synonyms = labels[syn.id].synonyms || [];
            labels[syn.id].synonyms.push(syn.label);
         } else {
            // Create a new entry with the synonym as the main label
            labels[syn.id] = {
               iri: syn.iri,
               label: syn.label,
               synonyms: []
            };
         }
      }
   }

   ret.labels = labels;
   
   // Add DOI metadata as a top-level object
   ret.doi_metadata = doiMetadata;

   // Remove null and empty fields recursively from the entire object
   function removeEmptyFields(obj) {
      if (typeof obj !== 'object' || obj === null) {
         return obj;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
         return obj.map(item => removeEmptyFields(item))
                  .filter(item => {
                     // Keep arrays even if empty
                     if (Array.isArray(item)) return true;
                     // For other values, filter out null, undefined, empty strings, and empty objects
                     return item !== null && item !== undefined && 
                            (typeof item !== 'string' || item !== '') &&
                            (typeof item !== 'object' || Object.keys(item).length > 0);
                  });
      }
      
      // Handle objects
      const result = {};
      for (const key in obj) {
         const value = removeEmptyFields(obj[key]);
         if (value !== null && value !== undefined && 
             (typeof value !== 'string' || value !== '') &&
             (typeof value !== 'object' || (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0))) {
            result[key] = value;
         }
      }
      return result;
   }
   
   // Clean the final output
   const cleanedOutput = removeEmptyFields(ret);

   console.log(JSON.stringify(cleanedOutput, null, 2));
}

await main();
