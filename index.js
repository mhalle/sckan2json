import * as dotenv from 'dotenv';
import stardogjs from 'stardog';
import { loadAllLocations, loadNPOSynonyms } from './load-npo-locations.js';
import { loadABCData } from './load-abc.js';


function addLabel(labels, obj, idattr = 'id', iriattr = 'iri', labelattr = 'label') {
   if (obj) {
      labels[obj[idattr]] = {};
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
   const locations = await loadAllLocations(conn);
   const synonyms = await loadNPOSynonyms(conn);
   const abc_segments = await loadABCData(conn);
   const [abc, segments] = abc_segments;




   const ret = {
      metadata: {
         query_date: new Date().toJSON()
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
      ret.neuron_metadata[meta.neuronID] = {
         label: meta.neuronLabel,
         species: meta.species ? meta.species : null,
         sex: meta?.sex,
         phenotypes: meta.phenotypes,
         forward_connections: meta.forwardConnections,
         alert: meta?.alert,
         reference: meta?.reference
      }
   });

   // collect node labels and IRIs in a lookup table
   for (let x of abc) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.origin);
      addLabel(labels, x.via);
      addLabel(labels, x.destination);
      addLabel(labels, x.targetOrgan);

      labels[x.neuron.id].label = x.neuronMetaData.neuronLabel;
   }

   ret.neural_segments = segments.map(x => ({
      id: x.neuron?.id,
      node1: x.node1?.id,
      node2: x.node2?.id
   }));

   for (let x of segments) {
      addLabel(labels, x.neuron);
      addLabel(labels, x.node1);
      addLabel(labels, x.node2);
   }

   // locations
   // check for unique locations
   const locationSet = new Set(locations.map(x => [x.id, x.connection_type]));

   ret.locations = Array.from(
      new Set(locations.map(x => ({
         id: x.id,
         location: x.connection_type
      }
      ))));

   // synonyms
   ret.synonyms = synonyms.map(x => ({ id: x.id, label: x.label }));

   ret.labels = labels;

   console.log(JSON.stringify(ret, null, 2));
}

await main();