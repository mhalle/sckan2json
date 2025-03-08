# SCKAN2JSON - Semantic Neuron Data Converter

*Convert SCKAN neuron information into a structured JSON file*

**Version 2.0**  
Michael Halle (m@halle.us) | Created: 2023-05-26 | Updated: 2024-03-08

## Summary

This Node.js application converts SPARC Connectivity Knowledge-base of the Autonomic Nervous System (SCKAN) data from the Stardog semantic database into a structured JSON document. Based on the SCKAN-Explorer app, it bridges the gap between semantic representations and more common data formats.

The enhanced version (2.0) includes:
- Richer neuron metadata including categorized phenotypes
- Model identification and categorization
- Preferred labels and synonyms
- Synaptic connection information
- More consistent data typing
- Human-readable documentation

## Install

```bash
npm install
```

## Configuration

The SCKAN database requires connection parameters, which can be set via environment variables or a `.env` file:

```
SCKAN_USERNAME=SPARC  # default
SCKAN_PASSWORD=********  # required
SCKAN_ENDPOINT=https://stardog.scicrunch.io:5821  # default
```

## Usage

```bash
node index.js > output.json
```

## Output Format

The JSON data structure contains comprehensive information about neurons and their connectivity, with all entities referenced by their CURIE IDs. The output contains rich metadata and cross-referenced information.

### Data Structure

The JSON output includes the following key sections:

#### 1. metadata
Contains file metadata and documentation:
- `query_date`: Timestamp of when the data was generated
- `version`: Version of the data format (2.0)
- `description`: Brief description of the dataset
- `documentation`: Detailed documentation of the file format

#### 2. neural_connectivity
Array of neuron connectivity records:
- `id`: Neuron ID
- `origin`: Origin location ID
- `via`: Via/intermediate location ID (optional)
- `destination`: Destination location ID
- `target_organ`: Target organ ID (optional)

#### 3. neuron_metadata
Dictionary of neuron metadata indexed by neuron ID:
- `label`: Human-readable label
- `preferred_label`: Preferred display label (optional)
- `species`: Array of species this neuron is observed in
- `sex`: Sex specification (can be null)
- `phenotypes`: Array of phenotype IDs
- `categorized_phenotypes`: Array of human-readable phenotype categories
- `forward_connections`: Array of forward neural connections
- `model_id`: Model identifier (e.g., "bolew", "keast")
- `model_category`: Human-readable model category
- `alert`: Alert notes (optional)
- `reference`: Reference information (optional)
- `diagram_link`: URL to diagram (optional)
- `citation`: Array of citation references

#### 4. neural_segments
Array of ordered neuron pathway segments:
- `id`: Neuron ID
- `nodes`: Array containing two connection nodes, each with:
  - `id`: Location ID
  - `type`: Node type (e.g., "hasSomaLocation", "hasAxonLocation")
- `is_synaptic`: Boolean indicating if this is a synaptic connection

#### 5. locations
Array of anatomical locations:
- `id`: Location ID
- `location_type`: Type categorization (soma, axon, terminal, sensory)
- `connection_type`: Connection type ID

#### 6. labels
Dictionary mapping IDs to IRIs and labels:
- For each ID, contains:
  - `iri`: Full IRI (URI reference)
  - `label`: Human-readable label
  - `synonyms`: Array of alternative labels/synonyms (if available)

### Using the Data

- All anatomical elements are represented by their ID in CURIE form
- Use the `labels` dictionary to convert IDs to human-readable labels and IRIs
- To get a human-readable label for any ID: `labels[id].label`
- For neuron node types (hasSomaLocation, etc.), use the predefined mappings
- Categorized phenotypes provide standardized terminology
- Model categorization helps organize neurons into functional groups

## Version 2.0 Enhancements

The 2.0 version of SCKAN2JSON includes several improvements:

1. **Enhanced Neuron Metadata**
   - Added preferred labels for more accurate neuron identification
   - Included diagram links for visualization resources
   - Added citation information for references
   - Organized phenotypes into standardized categories

2. **Model Classification**
   - Automatically detects model types from neuron IDs
   - Groups neurons into functional models (Bolser-Lewis, Keast, SAWG, etc.)
   - Provides human-readable model categories

3. **Improved Neural Pathway Representation**
   - Restructured segments with node arrays for consistency
   - Added node types for better context (soma, axon, terminal)
   - Included synaptic connection flags

4. **Consolidated Labels and Synonyms**
   - Combined synonyms into the labels dictionary
   - Added human-readable mappings for node types
   - More efficient lookup structure

5. **Type Consistency**
   - Ensured array fields are always arrays (never null)
   - Standardized string field handling
   - Clear data type expectations throughout

6. **Comprehensive Documentation**
   - Added detailed file format documentation
   - Included usage examples
   - Improved README with detailed information

## Credits

Based on the SCKAN-Explorer app (https://github.com/smtifahim/SCKAN-Apps)
