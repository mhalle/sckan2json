import * as dotenv from 'dotenv';
import stardogjs from 'stardog';
import { loadAllLocations, loadNPOSynonyms } from './load-npo-locations.js';
import { loadABCData } from './load-abc.js';


function addLabel(labels, obj, idattr = 'id', iriattr = 'iri', labelattr = 'label', extraAttrs = {}) {
   if (obj) {
      labels[obj[idattr]] = labels[obj[idattr]] || {};
      labels[obj[idattr]][iriattr] = obj[iriattr];
      labels[obj[idattr]][labelattr] = obj[labelattr];
      
      // Add any extra attributes
      for (const [key, value] of Object.entries(extraAttrs)) {
         if (obj[value] !== undefined) {
            labels[obj[idattr]][key] = obj[value];
         }
      }
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
         label: meta.label,
         preferred_label: meta.preferred_label,
         species: meta.species ? meta.species : null,
         sex: meta?.sex,
         phenotypes: meta.phenotypes,
         categorized_phenotypes: meta.categorized_phenotypes,
         forward_connections: meta.forward_connections,
         alert: meta?.alert,
         reference: meta?.reference,
         diagram_link: meta?.diagram_link,
         citation: meta?.citation,
         model_id: meta?.model_id,
         model_category: meta?.model_category
      }
   });

   // collect node labels and IRIs in a lookup table
   for (let x of abc) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.origin);
      addLabel(labels, x.via);
      addLabel(labels, x.destination);
      addLabel(labels, x.targetOrgan);

      if (x.neuron?.id) {
         labels[x.neuron.id].label = x.neuronMetaData.label;
         
         // Add preferred label if available
         if (x.neuronMetaData.preferred_label) {
            labels[x.neuron.id].preferred_label = x.neuronMetaData.preferred_label;
         }
         
         // Add model category information if available
         if (x.neuronMetaData.model_id) {
            labels[x.neuron.id].model_id = x.neuronMetaData.model_id;
            labels[x.neuron.id].model_category = x.neuronMetaData.model_category;
         }
      }
   }

   ret.neural_segments = segments.map(x => ({
      id: x.neuron?.id,
      node1: x.node1?.id,
      node2: x.node2?.id,
      node1_type: x.node1_type,
      node2_type: x.node2_type,
      is_synaptic: x.is_synaptic || false
   }));

   for (let x of segments) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.node1);
      addLabel(labels, x.node2);
      
      // Add node type information to the labels lookup
      if (x.node1?.id && x.node1_type) {
         labels[x.node1.id].node_type = x.node1_type;
      }
      
      if (x.node2?.id && x.node2_type) {
         labels[x.node2.id].node_type = x.node2_type;
      }
   }

   // Enhanced locations with more detailed type information
   ret.locations = Array.from(
      new Set(locations.map(x => ({
         id: x.id,
         location_type: x.connection_type,
         connection_type: x.connection_id
      })))
   );

   // Add location info to the labels
   for (let loc of locations) {
      if (loc.id && labels[loc.id]) {
         labels[loc.id].location_type = loc.connection_type;
         labels[loc.id].connection_type = loc.connection_id;
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
