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
         description: "Enhanced SCKAN data with additional metadata"
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

   // synonyms with expanded information
   ret.synonyms = synonyms.map(x => ({ 
      id: x.id, 
      label: x.label,
      iri: x.iri 
   }));

   ret.labels = labels;

   console.log(JSON.stringify(ret, null, 2));
}

await main();
