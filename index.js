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

   const ret = {
      metadata: {
         query_date: new Date().toJSON(),
         version: "2.0",
         description: "Enhanced SCKAN data with additional metadata",
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
   - reference: Reference information (optional)
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
   ret.neural_connectivity = abc.map(x => ({
      id: x.neuron?.id,
      origin: x.origin?.id,
      via: x.via?.id,
      destination: x.destination?.id,
      target_organ: x.targetOrgan?.id,
   }))

   // abc neuron metadata

   ret.neuron_metadata = {};
   abc.forEach((x) => {
      const meta = x.neuronMetaData;
      ret.neuron_metadata[meta.id] = {
         // String fields (can be null but not undefined)
         label: meta.label,
         preferred_label: meta.preferred_label,
         sex: meta.sex,
         alert: meta.alert,
         reference: meta.reference,
         diagram_link: meta.diagram_link,
         model_id: meta.model_id,
         model_category: meta.model_category,
         
         // Array fields (always arrays, never null)
         species: meta.species || [],
         phenotypes: meta.phenotypes || [],
         categorized_phenotypes: meta.categorized_phenotypes || [],
         forward_connections: meta.forward_connections || [],
         citation: meta.citation || []
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

   ret.neural_segments = segments.map(x => ({
      id: x.neuron?.id,
      nodes: [
         {
            id: x.node1?.id,
            type: x.node1_type
         },
         {
            id: x.node2?.id,
            type: x.node2_type
         }
      ],
      is_synaptic: x.is_synaptic || false
   }));

   // Add segment labels to the labels dictionary (only IRI and label mappings)
   for (let x of segments) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.node1);
      addLabel(labels, x.node2);
   }

   // Enhanced locations with more detailed type information
   ret.locations = Array.from(
      new Set(locations.map(x => ({
         id: x.id,
         location_type: x.connection_type,
         connection_type: x.connection_id
      })))
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

   console.log(JSON.stringify(ret, null, 2));
}

await main();
