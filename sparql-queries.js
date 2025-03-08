export const npo_all_locations_o = 
`# QUERY: This query is for loading the soma locations for sckan explorer's auto-complete text input.
# The query returns all the connected anatomical locations along with their synonyms based on the 
# locational phenotype relations on the  NPO neuron types.  
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX partOf: <http://purl.obolibrary.org/obo/BFO_0000050>
PREFIX ilxtr: <http://uri.interlex.org/tgbugs/uris/readable/>

SELECT DISTINCT ?Connection_Type ?Location_IRI ?Location_Label
{
    ?Neuron_ID ?Connection_Type ?Location_IRI.
    ?Connection_Type rdfs:subPropertyOf+ ilxtr:hasConnectedLocation.
    ?Neuron_ID ilxtr:hasSomaLocation ?s;
               (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?x.                    
        
    # Consider rdfs:label or any of the synonyms for the Location_Label for the UI autocomplete search. 
    ?Location_IRI (rdfs:label | NIFRID:synonym | oboInOwl:hasExactSynonym) ?Location_Label.
}
ORDER BY ?Neuron_ID  DESC(?Location_ID) ?Location_Label
LIMIT 100000`

export const npo_synonyms = 
`  
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX partOf: <http://purl.obolibrary.org/obo/BFO_0000050>
PREFIX ilxtr: <http://uri.interlex.org/tgbugs/uris/readable/>

SELECT DISTINCT ?Location_IRI ?Location_Label
{
    ?Neuron_ID ?Connection_Type ?Location_IRI.
    ?Connection_Type rdfs:subPropertyOf+ ilxtr:hasConnectedLocation.
    ?Neuron_ID ilxtr:hasSomaLocation ?s;
               (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?x.                    
        
    ?Location_IRI (NIFRID:synonym | oboInOwl:hasExactSynonym) ?Location_Label.
}
ORDER BY DESC(?Location_ID) ?Location_Label
LIMIT 100000`



export const npo_all_locations = 
`# QUERY: This query is for loading the soma locations for sckan explorer's auto-complete text input.
# The query returns all the connected anatomical locations (no synonyms) based on the 
# locational phenotype relations on the  NPO neuron types.  
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX partOf: <http://purl.obolibrary.org/obo/BFO_0000050>
PREFIX ilxtr: <http://uri.interlex.org/tgbugs/uris/readable/>

SELECT DISTINCT ?Connection_Type ?Location_IRI ?Location_Label
{
    #FILTER (lcase(?Location_Label) = 'nodose ganglion')
    ?Neuron_ID ?Connection_Type ?Location_IRI.
    ?Connection_Type rdfs:subPropertyOf+ ilxtr:hasConnectedLocation.
    ?Neuron_ID ilxtr:hasSomaLocation ?s;
               (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?x.                    
        
    # Consider rdfs:label for the Location_Label for the UI autocomplete search. 
    ?Location_IRI rdfs:label ?Location_Label.
}
ORDER BY ?Neuron_ID  DESC(?Location_ID) ?Location_Label
LIMIT 100000`

export const a_b_via_c =
`# QUERY: This query is for loading the a-b-via-c results in sckan-explorer.

PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX partOf: <http://purl.obolibrary.org/obo/BFO_0000050>
PREFIX ilxtr: <http://uri.interlex.org/tgbugs/uris/readable/>

# Neuron populations where A projects to B via some Nerve C

SELECT DISTINCT ?Neuron_ID ?A_IRI ?A_Label ?B_IRI ?B_Label ?C_IRI ?C_Label ?Target_Organ_IRI ?Target_Organ_Label
{                
    ?Neuron_ID rdfs:subClassOf*/rdfs:label 'Neuron'. #http://uri.neuinfo.org/nif/nifstd/sao1417703748
    
    ?Neuron_ID ilxtr:hasSomaLocation ?A_IRI.
            ?A_IRI (rdfs:label) ?A_Label.
   
    OPTIONAL {?Neuron_ID ilxtr:hasAxonLocation ?C_IRI. 
                    ?C_IRI rdfs:label ?C_Label.}
    
    ?Neuron_ID (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?B_IRI.
                ?B_IRI (rdfs:label) ?B_Label.

    OPTIONAL{?B_IRI rdfs:subClassOf+ [rdf:type owl:Restriction ;
                                    owl:onProperty partOf: ; 
                                    owl:someValuesFrom ?Target_Organ_IRI].
    ?Target_Organ_IRI rdfs:label ?Target_Organ_Label
                    
    FILTER (?Target_Organ_Label in ( 'heart', 'ovary', 'brain', 'urethra', 'esophagus', 'skin of body', 'lung', 'liver', 
                                'lower urinary tract', 'urinary tract', 'muscle organ','gallbladder', 'colon', 'kidney', 
                                'large intestine' ,'small intestine', 'stomach', 'spleen', 'urinary bladder', 
                                'penis', 'clitoris', 'pancreas'))}               
}
ORDER BY ?Neuron_ID ?A_Label ?B_IRI ?C_Label
LIMIT 120000`

export const npo_neuron_meta = 
`# QUERY: This query is for loading the a-b-via-c results in sckan

PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX partOf: <http://purl.obolibrary.org/obo/BFO_0000050>
PREFIX ilxtr: <http://uri.interlex.org/tgbugs/uris/readable/>

# Neuron populations where A projects to B via some Nerve C

SELECT DISTINCT ?Neuron_IRI ?Neuron_Label ?Species ?Sex ?Phenotypes ?Forward_Connections ?Alert ?Reference
WHERE
{
    { 
        SELECT DISTINCT  ?Neuron_IRI ?Neuron_Label ?Sex ?Alert ?Reference  
        WHERE                  
        {
            ?Neuron_IRI rdfs:subClassOf*/rdfs:label 'Neuron'. #http://uri.neuinfo.org/nif/nifstd/sao1417703748   
            OPTIONAL{?Neuron_IRI rdfs:label ?Neuron_Label.}
            ?Neuron_IRI ilxtr:hasSomaLocation ?A_IRI.
                    ?A_IRI (rdfs:label) ?A_Label.
            OPTIONAL {?Neuron_IRI ilxtr:hasAxonLocation ?C_IRI. 
                        ?C_IRI rdfs:label ?C_Label.}
            ?Neuron_IRI (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?B_IRI.
                    ?B_IRI (rdfs:label) ?B_Label.
                    
            OPTIONAL {?Neuron_IRI ilxtr:hasPhenotypicSex/rdfs:label ?Sex.}
            OPTIONAL {?Neuron_IRI ilxtr:reference ?Reference.}
            OPTIONAL {?Neuron_IRI ilxtr:alertNote ?Alert.}

        }
    }
    
    { 
        SELECT DISTINCT  ?Neuron_IRI ?Neuron_Label 
        (group_concat(distinct ?ObservedIn; separator="|") as ?Species) 
        WHERE                  
        {
            ?Neuron_IRI rdfs:subClassOf*/rdfs:label 'Neuron'. #http://uri.neuinfo.org/nif/nifstd/sao1417703748   
            OPTIONAL{?Neuron_IRI rdfs:label ?Neuron_Label.}
            ?Neuron_IRI ilxtr:hasSomaLocation ?A_IRI.
                    ?A_IRI (rdfs:label) ?A_Label.
            OPTIONAL {?Neuron_IRI ilxtr:hasAxonLocation ?C_IRI. 
                        ?C_IRI rdfs:label ?C_Label.}
            ?Neuron_IRI (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?B_IRI.
                    ?B_IRI (rdfs:label) ?B_Label.
                    
            OPTIONAL {?Neuron_IRI ilxtr:isObservedInSpecies/rdfs:label ?ObservedIn.}

        }
        GROUP BY ?Neuron_IRI ?Neuron_Label
    }
    {
        SELECT DISTINCT  ?Neuron_IRI ?Neuron_Label 
        (group_concat(distinct ?ForwardConnection; separator="|") as ?Forward_Connections)  
        WHERE                  
        {
            ?Neuron_IRI rdfs:subClassOf*/rdfs:label 'Neuron'. #http://uri.neuinfo.org/nif/nifstd/sao1417703748   
            OPTIONAL{?Neuron_IRI rdfs:label ?Neuron_Label.}
            ?Neuron_IRI ilxtr:hasSomaLocation ?A_IRI.
                    ?A_IRI (rdfs:label) ?A_Label.
            optional {?Neuron_IRI ilxtr:hasAxonLocation ?C_IRI. 
                        ?C_IRI rdfs:label ?C_Label.}
            ?Neuron_IRI (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?B_IRI.
                    ?B_IRI (rdfs:label) ?B_Label.
            OPTIONAL {?Neuron_IRI ilxtr:hasForwardConnection ?ForwardConnection.}
        }
        GROUP BY ?Neuron_IRI ?Neuron_Label
    }

    {
        SELECT DISTINCT  ?Neuron_IRI ?Neuron_Label 
        (group_concat(distinct ?Phenotype; separator="|") as ?Phenotypes) 
        WHERE                  
        {
            ?Neuron_IRI rdfs:subClassOf*/rdfs:label 'Neuron'. #http://uri.neuinfo.org/nif/nifstd/sao1417703748   
            OPTIONAL{?Neuron_IRI rdfs:label ?Neuron_Label.}
            ?Neuron_IRI ilxtr:hasSomaLocation ?A_IRI.
                    ?A_IRI (rdfs:label) ?A_Label.
            optional {?Neuron_IRI ilxtr:hasAxonLocation ?C_IRI. 
                        ?C_IRI rdfs:label ?C_Label.}
            ?Neuron_IRI (ilxtr:hasAxonTerminalLocation | ilxtr:hasAxonSensoryLocation) ?B_IRI.
                    ?B_IRI (rdfs:label) ?B_Label.
            OPTIONAL {?Neuron_IRI (ilxtr:hasNeuronalPhenotype | 
                                  ilxtr:hasFunctionalCircuitRole |
                                  ilxtr:hasCircuitRole |
                                  ilxtr:hasProjection  
                                  )/rdfs:label ?Phenotype.}
        }
        GROUP BY ?Neuron_IRI ?Neuron_Label
    }
}
ORDER BY ?Neuron_IRI
LIMIT 100000`

export const npo_partial_order =
`## Axonal path query based on SCKAN Explorer's implementation

PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX ilxtr: <http://uri.interlex.org/tgbugs/uris/readable/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT DISTINCT ?Neuron_IRI ?Neuron_Label ?V1 ?V1_Label ?V2 ?V2_Label ?V1_Type ?V2_Type ?IsSynapse
WHERE 
{
    ?V1 ilxtr:hasNextNode{ilxtr:isConnectedBy ?Neuron_IRI} ?V2.
    
    ?V1 rdfs:label ?V1_Label. ?V2 rdfs:label ?V2_Label.
    OPTIONAL {?Neuron_IRI rdfs:label ?Neuron_Label.}
   
    # Find the locational phenotypes for the V1 node
    ?Neuron_IRI ?V1_Location_Type_IRI ?V1.
    ?V1_Location_Type_IRI rdfs:label ?V1_Type.
    
    # Find the locational phenotype for the V2 node
    ?Neuron_IRI ?V2_Location_Type_IRI ?V2.
    ?V2_Location_Type_IRI rdfs:label ?V2_Type.
  
    # Filter out the generic hasConnectedLocation relation for the connected nodes.
    FILTER (ilxtr:hasConnectedLocation not in (?V1_Location_Type_IRI, ?V2_Location_Type_IRI))
    
    # Check if ?V2 is associated with a synapse
    OPTIONAL 
    {
        ?Neuron_IRI ilxtr:hasForwardConnection/ilxtr:hasSomaLocation ?Synapse.
        FILTER (?V2 = ?Synapse)
        FILTER (?V2_Type = "hasAxonTerminalLocation")
    }
    
    # Set IsSynapse to "Yes" if a synapse is detected, otherwise leave it as NO
    BIND (IF (BOUND(?Synapse), "YES", "NO") AS ?IsSynapse)
}
ORDER BY ?Neuron_IRI ?V1_Label ?V2_Label
LIMIT 20000`