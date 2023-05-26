# Read SCKAN neuron information into a JSON file

Michael Halle (m@halle.us) 2023-05-26

## Summary

Based heavily on the SCKAN-Explorer app (https://github.com/smtifahim/SCKAN-Apps), this node.js application converts SPARC neuron information stored in scicrunch stardog database into a JSON document. It is a prototype proof of concept designed to show that the gap between semantic representations and more common data representations can be bridged.

## Install

```npm install```

The SCKAN database requires connection parameters to be configured. This configuration can be done using environment variables, or with a file called ```.env``` in the execution directory. The following variables can be set:

* ```SCKAN_USERNAME``` (default ```SPARC```)
* ```SCKAN_PASSWORD``` (required)
* ```SCKAN_ENDPOINT``` (default to the scicrunch db)

## Usage

```node index.js > output.json```

(Hey, no one said that this is a fancy app or anything.)

## Output
The resulting JSON data structure contains information about neurons: 
* their endpoints and paths (From A to B via C, with target organ)
* segments of the neural pathway (pathway between node1 and node2)
* metadata about the neurons
* location of neurons (soma, via, terminal, sensory)
* a lookup table to find the label and IRI of all references

In more detail, here are the keys and values of the output JSON dictionary. Note that I chose these key names based on the original application and without significant domain knowledge. These names should be changed by someone who knows what they are doing.

All anatomical elements are represented by their ID in CURIE form. IDs can be mapped to IRIs and labels using the `labels` table.

* `metadata`:
    - `query_date`: Contains the date when the query was made.
* `neural_connectivity`: Contains a list of objects representing neurons. Each object may contain ids of the neuron and its origin, via, destination, and target organ. The `via` and `target_organ` attributes are not always present.
    - `id`: ID of the neuron
    - `origin`: ID of the origin structure
    - `via`: ID of the via structure
    - `destination`: ID of the destination structure
    - `target_organ`: ID of the target organ
* `neuron_metadata`: A dictionary (object) mapping neuron IDs to addition information about the neuron. The value of each key has the following properties:
    - `label`: The text label of the neuron
    - `species`: List of species
    - `sex`: Sex (may be null)
    - `phenomes`: List of phenomes
    - `forward_connections`: List of IDs representing forward connections.
    - `alert`
    - `reference`
* `neural_segments`: A list of objects describing segments of neural pathways
    - `id`: ID of the neuron
    - `node1`: ID of one node on the pathway
    - `node2`: ID of second node on the pathway
* `locations`: List of objects describing the location of each neuron. Note that neurons may have more than one location, and thus multiple entries.
    - `id`: neuron ID
    - `location`: one of `via, soma, terminal, sensory`
* `synonyms`: List of objects describing synonyms (alternate labels) for given neurons. Neurons may have more than one synonym, and thus have more than one entry.
    - `id`: neuron ID
    - `label`: text label for neuron. Includes rdfs:label and all synonyms.
* `labels`: A dictonary (object) with keys representing entity IDs and values including text labels and IRIs. Consolitating labels and IRIs in one table reduces redundancy and representation size. 
    - `iri`: the full IRI that corresponds to the CURIEd form of the entity ID
    - `label`: the canonical text label for this entity
