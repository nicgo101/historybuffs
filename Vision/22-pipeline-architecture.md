# Adaptive Pipeline Architecture

## Overview

Historical sources are wildly diverse: ancient Greek manuscripts, medieval Latin chronicles, 18th-century newspapers, handwritten letters, printed books, clay tablets, papyri. A rigid pipeline breaks on this diversity.

Instead, we build an **adaptive, node-based workflow system** — inspired by n8n — where documents flow through configurable pipelines with **AI decision nodes** at branch points. The AI examines content and routes it through appropriate processing paths.

---

## Core Concept

### The Problem with Rigid Pipelines

```
RIGID PIPELINE:
Document → OCR → Chunk → Embed → Extract → Store

BREAKS WHEN:
- OCR quality is garbage (need AI reconstruction)
- Document is already clean text (OCR unnecessary)
- Language is Greek (needs different tokenization)
- Document has images/maps (need separate handling)
- Text is fragmented (need reconstruction before chunking)
- Format is TEI-XML (structured, not raw text)
```

### The Adaptive Solution

```
ADAPTIVE PIPELINE:

Document → [AI: Assess] ─┬→ Clean text path
                         ├→ Poor OCR path → [AI: Reconstruct]
                         ├→ Structured XML path
                         ├→ Mixed media path → [Split] → Text / Images / Maps
                         └→ Non-Latin script path → [Specialized processing]
                         
Each path: further branches based on AI decisions
```

---

## Node Types

### Input Nodes

Nodes that bring content into the pipeline:

```yaml
input_nodes:
  source_fetch:
    description: "Fetch document from provider API"
    inputs: ["provider", "document_id", "format"]
    outputs: ["raw_content", "metadata", "format"]
    
  file_upload:
    description: "User-uploaded file"
    inputs: ["file"]
    outputs: ["raw_content", "filename", "mime_type"]
    
  url_fetch:
    description: "Fetch from URL"
    inputs: ["url"]
    outputs: ["raw_content", "content_type"]
    
  database_query:
    description: "Load existing content for reprocessing"
    inputs: ["source_id"]
    outputs: ["content", "existing_metadata"]
```

### Processing Nodes

Nodes that transform content:

```yaml
processing_nodes:
  ocr:
    description: "Run OCR on image/PDF"
    inputs: ["image_or_pdf"]
    outputs: ["raw_text", "confidence_scores", "layout_info"]
    config: ["engine", "language_hints"]
    
  ocr_enhance:
    description: "AI-enhanced OCR correction"
    inputs: ["raw_ocr_text", "original_image"]
    outputs: ["corrected_text", "corrections_made"]
    uses: "LLM to fix OCR errors using context + visual"
    
  chunk:
    description: "Split text into chunks"
    inputs: ["text"]
    outputs: ["chunks[]"]
    config: ["chunk_size", "overlap", "preserve_structure"]
    
  embed:
    description: "Generate vector embeddings"
    inputs: ["text"]
    outputs: ["embedding"]
    config: ["model", "dimensions"]
    
  translate:
    description: "Translate text"
    inputs: ["text", "source_language"]
    outputs: ["translated_text", "target_language"]
    config: ["target_language", "preserve_original"]
    
  normalize_dates:
    description: "Parse and normalize date references"
    inputs: ["text"]
    outputs: ["date_references[]"]
    
  parse_tei_xml:
    description: "Parse structured TEI-XML"
    inputs: ["xml_content"]
    outputs: ["structured_content", "metadata", "divisions"]
    
  extract_images:
    description: "Extract images from document"
    inputs: ["document"]
    outputs: ["images[]", "image_locations[]"]
    
  reconstruct_text:
    description: "AI reconstruction of damaged/fragmentary text"
    inputs: ["fragmentary_text", "context"]
    outputs: ["reconstructed_text", "confidence", "reconstruction_notes"]
```

### AI Decision Nodes

Nodes that examine content and decide routing:

```yaml
ai_decision_nodes:
  assess_quality:
    description: "Assess document quality and characteristics"
    inputs: ["content", "metadata"]
    outputs: ["quality_score", "characteristics", "recommended_path"]
    decisions:
      - "ocr_quality: good/poor/unusable"
      - "language: detected language(s)"
      - "script: latin/greek/cyrillic/arabic/hebrew/cjk/other"
      - "format: prose/poetry/tabular/mixed"
      - "completeness: complete/fragmentary/damaged"
      - "has_images: boolean"
      - "has_marginalia: boolean"
      
  route_by_language:
    description: "Route to language-specific processing"
    inputs: ["text", "detected_language"]
    outputs: ["selected_path"]
    paths:
      - "latin_greek_path"
      - "arabic_hebrew_path"
      - "cjk_path"
      - "standard_path"
      
  assess_ocr:
    description: "Decide if OCR needs enhancement"
    inputs: ["ocr_text", "confidence_scores"]
    outputs: ["needs_enhancement", "enhancement_level"]
    decisions:
      - "confidence > 0.95 → pass through"
      - "confidence 0.7-0.95 → light enhancement"
      - "confidence < 0.7 → heavy reconstruction"
      
  classify_content:
    description: "Classify document type for appropriate extraction"
    inputs: ["text_sample", "metadata"]
    outputs: ["document_type", "extraction_strategy"]
    types:
      - "narrative_history"
      - "chronicle"
      - "letters"
      - "legal_documents"
      - "religious_text"
      - "scientific_treatise"
      - "poetry"
      - "administrative_records"
      
  detect_structure:
    description: "Detect document structure"
    inputs: ["text"]
    outputs: ["structure_type", "divisions"]
    structures:
      - "chapters"
      - "books"
      - "sections"
      - "verses"
      - "entries"
      - "unstructured"
```

### Extraction Nodes

Nodes that extract structured data:

```yaml
extraction_nodes:
  extract_entities:
    description: "Extract named entities"
    inputs: ["text"]
    outputs: ["persons[]", "places[]", "organizations[]", "events[]"]
    config: ["language", "period_hints"]
    
  extract_dates:
    description: "Extract and normalize temporal references"
    inputs: ["text"]
    outputs: ["date_references[]"]
    handles:
      - "Absolute dates ('in the year 430 BCE')"
      - "Relative dates ('in the third year of the war')"
      - "Regnal dates ('in the 5th year of Augustus')"
      - "Calendar-specific ('Ides of March')"
      
  extract_relationships:
    description: "Extract relationships between entities"
    inputs: ["text", "entities"]
    outputs: ["relationships[]"]
    types:
      - "person-person (family, political, military)"
      - "person-place (birth, death, residence, travel)"
      - "person-event (participant, witness, author)"
      - "event-place (location)"
      
  extract_claims:
    description: "Extract factual claims from text"
    inputs: ["text", "source_context"]
    outputs: ["claims[]"]
    note: "Claims become Core Data (what the source asserts). Frame-independent until placed."
    
  extract_geographic:
    description: "Extract geographic references"
    inputs: ["text"]
    outputs: ["locations[]", "routes[]", "regions[]"]
    
  extract_environmental:
    description: "Extract environmental/astronomical observations"
    inputs: ["text"]
    outputs: ["weather[]", "astronomical[]", "natural_events[]"]
```

### Output Nodes

Nodes that store results:

```yaml
output_nodes:
  store_source:
    description: "Create/update source record"
    inputs: ["metadata", "content", "provenance"]
    outputs: ["source_id"]
    
  store_chunks:
    description: "Store document chunks with embeddings"
    inputs: ["chunks[]", "embeddings[]", "source_id"]
    outputs: ["chunk_ids[]"]
    
  store_entities:
    description: "Create/link entity records"
    inputs: ["entities[]", "source_id"]
    outputs: ["entity_ids[]", "new_count", "linked_count"]
    
  store_claims:
    description: "Store extracted claims for review"
    inputs: ["claims[]", "source_id"]
    outputs: ["claim_ids[]"]
    note: "Claims go to review queue as Core Data. Placements (frame-dependent dates) added during review."
    
  store_media:
    description: "Store extracted images/maps"
    inputs: ["media[]", "source_id"]
    outputs: ["media_ids[]"]
    
  notify_user:
    description: "Send notification to requesting user"
    inputs: ["user_id", "message", "link"]
    outputs: ["notification_sent"]
    
  queue_for_review:
    description: "Add items to human review queue"
    inputs: ["items[]", "review_type"]
    outputs: ["queue_ids[]"]
```

### Integration Nodes

Nodes that call external services:

```yaml
integration_nodes:
  call_llm:
    description: "Call LLM for any purpose"
    inputs: ["prompt", "context"]
    outputs: ["response"]
    config: ["model", "temperature", "max_tokens"]
    
  call_embedding_api:
    description: "Call embedding service"
    inputs: ["text"]
    outputs: ["embedding"]
    config: ["provider", "model"]
    
  call_translation_api:
    description: "Call translation service"
    inputs: ["text", "source_lang", "target_lang"]
    outputs: ["translated"]
    config: ["provider"]
    
  call_ocr_service:
    description: "Call OCR service"
    inputs: ["image"]
    outputs: ["text", "confidence"]
    config: ["provider", "language"]
    
  call_geocoding:
    description: "Geocode place names"
    inputs: ["place_name", "context_hints"]
    outputs: ["coordinates", "confidence"]
    
  webhook:
    description: "Call arbitrary webhook"
    inputs: ["url", "payload"]
    outputs: ["response"]
```

### Control Flow Nodes

Nodes that control pipeline flow:

```yaml
control_nodes:
  branch:
    description: "Conditional branch based on value"
    inputs: ["condition"]
    outputs: ["true_path", "false_path"]
    
  switch:
    description: "Multi-way branch"
    inputs: ["value"]
    outputs: ["path_1", "path_2", "path_n", "default"]
    
  merge:
    description: "Merge multiple paths"
    inputs: ["path_1", "path_2", "path_n"]
    outputs: ["merged"]
    
  loop:
    description: "Iterate over array"
    inputs: ["items[]"]
    outputs: ["item", "index", "done"]
    
  parallel:
    description: "Execute paths in parallel"
    inputs: ["items[]"]
    outputs: ["results[]"]
    
  wait:
    description: "Wait for condition or time"
    inputs: ["condition_or_duration"]
    outputs: ["trigger"]
    
  error_handler:
    description: "Handle errors in path"
    inputs: ["error"]
    outputs: ["retry", "skip", "fail"]
    config: ["retry_count", "fallback_path"]
```

---

## Example Workflows

### Standard Book Processing

```yaml
workflow: standard_book_processing
description: "Process a typical historical book from Internet Archive"

nodes:
  - id: fetch
    type: source_fetch
    config:
      provider: internet_archive
    
  - id: assess
    type: ai_decision.assess_quality
    inputs:
      content: "{{fetch.raw_content}}"
      metadata: "{{fetch.metadata}}"
    
  - id: route_quality
    type: control.switch
    inputs:
      value: "{{assess.ocr_quality}}"
    paths:
      good: ocr_good_path
      poor: ocr_poor_path
      unusable: ocr_unusable_path
      
  # Good OCR path
  - id: ocr_good_path
    type: control.branch
    next: chunk
    
  # Poor OCR path  
  - id: ocr_poor_path
    type: ocr_enhance
    inputs:
      raw_ocr_text: "{{fetch.raw_content}}"
    next: chunk
    
  # Unusable OCR path
  - id: ocr_unusable_path
    type: ocr
    config:
      engine: "tesseract_best"
    next: ai_reconstruct
    
  - id: ai_reconstruct
    type: reconstruct_text
    inputs:
      fragmentary_text: "{{ocr_unusable_path.raw_text}}"
    next: chunk
    
  - id: chunk
    type: chunk
    config:
      chunk_size: 2000
      overlap: 200
      preserve_structure: true
      
  - id: route_language
    type: ai_decision.route_by_language
    inputs:
      text: "{{chunk.chunks[0]}}"
      
  - id: embed
    type: parallel
    inputs:
      items: "{{chunk.chunks}}"
    each:
      type: embed
      config:
        model: "text-embedding-3-small"
        
  - id: extract_entities
    type: extract_entities
    inputs:
      text: "{{fetch.raw_content}}"
      
  - id: extract_dates
    type: extract_dates
    inputs:
      text: "{{fetch.raw_content}}"
      
  - id: extract_claims
    type: extract_claims
    inputs:
      text: "{{fetch.raw_content}}"
      source_context: "{{fetch.metadata}}"
      
  - id: store_source
    type: store_source
    inputs:
      metadata: "{{fetch.metadata}}"
      content: "{{chunk.text}}"  # Cleaned text
      
  - id: store_chunks
    type: store_chunks
    inputs:
      chunks: "{{chunk.chunks}}"
      embeddings: "{{embed.results}}"
      source_id: "{{store_source.source_id}}"
      
  - id: store_entities
    type: store_entities
    inputs:
      entities: "{{extract_entities}}"
      source_id: "{{store_source.source_id}}"
      
  - id: queue_claims
    type: queue_for_review
    inputs:
      items: "{{extract_claims.claims}}"
      review_type: "claim_verification"
      
  - id: notify
    type: notify_user
    inputs:
      message: "Your source is ready!"
```

### Classical Text (Perseus)

```yaml
workflow: classical_text_processing
description: "Process Greek/Latin text from Perseus"

nodes:
  - id: fetch
    type: source_fetch
    config:
      provider: perseus
      
  - id: parse_tei
    type: parse_tei_xml
    inputs:
      xml_content: "{{fetch.raw_content}}"
    note: "Perseus provides structured TEI-XML"
    
  - id: detect_language
    type: ai_decision.route_by_language
    inputs:
      text: "{{parse_tei.structured_content}}"
      
  - id: greek_latin_branch
    type: control.branch
    condition: "{{detect_language.selected_path}} in ['greek', 'latin']"
    true: classical_processing
    false: standard_processing
    
  # Classical language processing
  - id: classical_processing
    type: control.sequence
    steps:
      - id: chunk_by_structure
        type: chunk
        config:
          strategy: "use_tei_divisions"  # Use book/chapter structure
          preserve_references: true
          
      - id: parallel_process
        type: parallel
        branches:
          - embed_original:
              type: embed
              inputs:
                text: "{{chunk_by_structure.chunks}}"
                
          - translate:
              type: translate
              config:
                target_language: "english"
              inputs:
                text: "{{chunk_by_structure.chunks}}"
                source_language: "{{detect_language.language}}"
                
          - embed_translated:
              type: embed
              inputs:
                text: "{{translate.translated_text}}"
                
      - id: extract_classical_entities
        type: extract_entities
        config:
          entity_model: "classical"  # Specialized for ancient names/places
          
  - id: store_bilingual
    type: store_source
    inputs:
      original_text: "{{chunk_by_structure.chunks}}"
      translated_text: "{{translate.translated_text}}"
      original_embeddings: "{{embed_original.embeddings}}"
      translated_embeddings: "{{embed_translated.embeddings}}"
```

### Damaged/Fragmentary Text

```yaml
workflow: fragmentary_text_processing
description: "Process damaged papyri, fragmentary manuscripts"

nodes:
  - id: fetch
    type: source_fetch
    
  - id: assess_damage
    type: ai_decision.assess_quality
    
  - id: route_by_damage
    type: control.switch
    inputs:
      value: "{{assess_damage.completeness}}"
    paths:
      complete: standard_path
      fragmentary: reconstruction_path
      damaged: heavy_reconstruction_path
      
  # Reconstruction path
  - id: reconstruction_path
    type: control.sequence
    steps:
      - id: identify_gaps
        type: call_llm
        inputs:
          prompt: |
            Analyze this fragmentary text and identify:
            1. Clear readable sections
            2. Damaged/unclear sections (mark with [...])
            3. Missing sections (estimate extent)
            
            Text: {{fetch.raw_content}}
            
      - id: reconstruct_with_context
        type: call_llm
        inputs:
          prompt: |
            Given this fragmentary ancient text with gaps marked [...],
            provide scholarly reconstruction suggestions.
            
            For each gap:
            - Suggest possible readings
            - Rate confidence (high/medium/low/speculative)
            - Cite parallels if known
            
            Do NOT present reconstructions as certain.
            
            Text: {{identify_gaps.response}}
            
      - id: store_with_apparatus
        type: store_source
        inputs:
          original_text: "{{fetch.raw_content}}"
          reconstructed_text: "{{reconstruct_with_context.response}}"
          reconstruction_confidence: "{{reconstruct_with_context.confidence}}"
          apparatus_notes: "{{reconstruct_with_context.notes}}"
```

### Mixed Media Document

```yaml
workflow: mixed_media_processing
description: "Process document with text, images, and maps"

nodes:
  - id: fetch
    type: source_fetch
    
  - id: assess
    type: ai_decision.assess_quality
    
  - id: has_images
    type: control.branch
    condition: "{{assess.has_images}}"
    true: split_media
    false: text_only
    
  - id: split_media
    type: extract_images
    inputs:
      document: "{{fetch.raw_content}}"
      
  - id: parallel_processing
    type: parallel
    branches:
      # Text processing
      - text_path:
          type: control.sequence
          steps:
            - chunk_text
            - embed_text
            - extract_entities
            
      # Image processing
      - image_path:
          type: loop
          inputs:
            items: "{{split_media.images}}"
          each:
            type: control.sequence
            steps:
              - id: classify_image
                type: call_llm
                inputs:
                  prompt: |
                    Classify this image:
                    - map
                    - illustration
                    - diagram
                    - portrait
                    - photograph
                    - decorative
                    
              - id: route_image
                type: control.switch
                inputs:
                  value: "{{classify_image.type}}"
                paths:
                  map: map_processing
                  illustration: illustration_processing
                  diagram: diagram_processing
                  default: store_image
                  
              - id: map_processing
                type: control.sequence
                steps:
                  - id: analyze_map
                    type: call_llm
                    inputs:
                      prompt: |
                        Analyze this historical map:
                        - Region depicted
                        - Approximate date
                        - Notable features
                        - Place names visible
                        
                  - id: extract_map_places
                    type: extract_geographic
                    inputs:
                      context: "{{analyze_map.response}}"
                      
                  - id: store_map
                    type: store_media
                    inputs:
                      media_type: "map"
                      analysis: "{{analyze_map.response}}"
                      extracted_places: "{{extract_map_places.locations}}"
```

---

## AI Decision Prompts

### Quality Assessment

```python
QUALITY_ASSESSMENT_PROMPT = """
Analyze this document content and metadata to assess processing needs.

METADATA:
{metadata}

CONTENT SAMPLE (first 2000 chars):
{content_sample}

Assess the following:

1. OCR_QUALITY (if applicable):
   - good: Clear, readable, few errors
   - poor: Readable but many errors, needs cleanup
   - unusable: Severely degraded, needs reprocessing
   
2. LANGUAGE:
   - Primary language
   - Secondary languages (if any)
   - Script type (latin/greek/cyrillic/arabic/hebrew/cjk)
   
3. DOCUMENT_TYPE:
   - narrative_history, chronicle, letters, legal, religious, scientific, poetry, administrative, other
   
4. COMPLETENESS:
   - complete: Full text present
   - fragmentary: Gaps, missing sections
   - damaged: Significant damage affecting readability
   
5. STRUCTURE:
   - chapters, books, sections, verses, entries, unstructured
   
6. SPECIAL_HANDLING:
   - has_images: boolean
   - has_marginalia: boolean
   - has_tables: boolean
   - multiple_columns: boolean
   
7. RECOMMENDED_PATH:
   - standard, ocr_enhancement, heavy_reconstruction, structured_xml, classical_text, etc.

Respond in JSON format.
"""
```

### OCR Enhancement

```python
OCR_ENHANCEMENT_PROMPT = """
You are correcting OCR errors in a historical text. The OCR has introduced errors.

CONTEXT:
- Document: {document_title}
- Period: {period}
- Language: {language}

ORIGINAL OCR TEXT:
{ocr_text}

Correct obvious OCR errors while:
1. Preserving the original meaning
2. Keeping period-appropriate spelling (don't modernize)
3. Marking uncertain corrections with [?]
4. Noting significant corrections in a separate list

Common OCR errors to watch for:
- 'rn' misread as 'm'
- 'cl' misread as 'd'
- 'li' misread as 'h'
- Long 's' (ſ) misread
- Ligatures misread
- Line break errors

Provide:
1. CORRECTED_TEXT: The cleaned text
2. CORRECTIONS: List of significant changes made
3. CONFIDENCE: Overall confidence in corrections (high/medium/low)
"""
```

### Entity Extraction (Classical)

```python
CLASSICAL_ENTITY_EXTRACTION_PROMPT = """
Extract named entities from this classical text.

TEXT:
{text}

SOURCE CONTEXT:
- Author: {author}
- Period: {period}
- Subject: {subject}

Extract:

1. PERSONS:
   - Name (as written)
   - Normalized name (standard form)
   - Role/description
   - Dates (if inferrable)
   
2. PLACES:
   - Name (as written)
   - Modern equivalent (if known)
   - Type (city/region/river/mountain/etc.)
   
3. PEOPLES/GROUPS:
   - Name (as written)
   - Type (ethnic group/political entity/military unit)
   
4. EVENTS:
   - Description
   - Date (if given)
   - Participants
   - Location

5. DATES/TIME REFERENCES:
   - As written
   - Normalized (if possible)
   - Reference system (Olympiad/Regnal/AUC/etc.)

Be careful with:
- Multiple people with same name (common in classical texts)
- Place name changes over time
- Mythological vs. historical figures
- Poetic/literary references vs. historical claims

Respond in JSON format.
"""
```

---

## Pipeline Data Flow

### Document State Object

As a document flows through the pipeline, it accumulates data:

```python
@dataclass
class PipelineState:
    # Original input
    raw_content: bytes | str
    metadata: dict
    provider: str
    provider_id: str
    
    # Assessment results
    quality_assessment: QualityAssessment | None
    detected_language: str | None
    document_type: str | None
    
    # Processed content
    cleaned_text: str | None
    chunks: list[Chunk] | None
    embeddings: list[Embedding] | None
    
    # Extracted data
    entities: ExtractedEntities | None
    date_references: list[DateReference] | None
    claims: list[Claim] | None
    geographic_references: list[Location] | None
    
    # Media
    images: list[Image] | None
    maps: list[Map] | None
    
    # Storage references
    source_id: UUID | None
    chunk_ids: list[UUID] | None
    entity_ids: list[UUID] | None
    
    # Processing metadata
    pipeline_name: str
    started_at: datetime
    completed_nodes: list[str]
    errors: list[PipelineError]
    
    def add_result(self, node_id: str, result: Any):
        """Add result from a node."""
        self.completed_nodes.append(node_id)
        # Merge result into state based on node type
        
    def get_input(self, path: str) -> Any:
        """Get value by path (e.g., 'quality_assessment.ocr_quality')"""
        pass
```

### Execution Engine

```python
class PipelineExecutor:
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
        self.node_handlers = self._load_handlers()
        
    async def execute(self, initial_input: dict) -> PipelineState:
        state = PipelineState(**initial_input)
        
        # Start with entry node
        current_node = self.workflow.entry_node
        
        while current_node:
            try:
                # Get handler for node type
                handler = self.node_handlers[current_node.type]
                
                # Resolve inputs from state
                inputs = self._resolve_inputs(current_node.inputs, state)
                
                # Execute node
                result = await handler.execute(inputs, current_node.config)
                
                # Update state
                state.add_result(current_node.id, result)
                
                # Determine next node
                current_node = self._get_next_node(current_node, result, state)
                
            except Exception as e:
                state.errors.append(PipelineError(
                    node_id=current_node.id,
                    error=str(e)
                ))
                
                # Try error handler if defined
                if current_node.error_handler:
                    current_node = self._handle_error(current_node, e, state)
                else:
                    raise
                    
        return state
    
    def _get_next_node(self, current: Node, result: Any, state: PipelineState) -> Node | None:
        """Determine next node based on result and node type."""
        
        if current.type.startswith('control.'):
            # Control nodes determine their own routing
            return self._route_control_node(current, result)
            
        elif current.type.startswith('ai_decision.'):
            # AI decision nodes route based on decision
            return self._route_ai_decision(current, result)
            
        else:
            # Standard nodes go to their configured 'next'
            return self.workflow.get_node(current.next) if current.next else None
```

---

## Workflow Builder UI

### Visual Editor

```
WORKFLOW BUILDER: Classical Text Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOOLBOX                    CANVAS
┌──────────────┐          ┌────────────────────────────────────────┐
│ INPUT        │          │                                        │
│ ├ Source Fetch│         │  ┌─────────┐    ┌──────────┐          │
│ ├ File Upload │────────►│  │ Fetch   │───►│ Assess   │          │
│ └ URL Fetch  │          │  │ Source  │    │ Quality  │          │
│              │          │  └─────────┘    └────┬─────┘          │
│ PROCESSING   │          │                      │                 │
│ ├ OCR        │          │         ┌────────────┼────────────┐   │
│ ├ OCR Enhance│          │         ▼            ▼            ▼   │
│ ├ Chunk      │          │    ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ ├ Embed      │          │    │  Good   │ │  Poor   │ │Unusable ││
│ ├ Translate  │          │    │  OCR    │ │  OCR    │ │  OCR    ││
│ └ Parse TEI  │          │    └────┬────┘ └────┬────┘ └────┬────┘│
│              │          │         │           │           │     │
│ AI DECISION  │          │         │      ┌────┴────┐ ┌────┴────┐│
│ ├ Assess     │          │         │      │ Enhance │ │  Re-OCR ││
│ ├ Route Lang │          │         │      │   OCR   │ │ + Recon ││
│ ├ Classify   │          │         │      └────┬────┘ └────┬────┘│
│ └ Detect Str │          │         │           │           │     │
│              │          │         └───────────┴───────────┘     │
│ EXTRACTION   │          │                     │                  │
│ ├ Entities   │          │                     ▼                  │
│ ├ Dates      │          │              ┌───────────┐            │
│ ├ Claims     │          │              │   Chunk   │            │
│ └ Geographic │          │              └─────┬─────┘            │
│              │          │                    │                   │
│ OUTPUT       │          │         ┌──────────┴──────────┐       │
│ ├ Store Source│         │         ▼                     ▼       │
│ ├ Store Chunks│         │   ┌───────────┐        ┌───────────┐  │
│ ├ Notify User│          │   │  Embed    │        │  Extract  │  │
│ └ Queue Review│         │   └─────┬─────┘        │  Entities │  │
│              │          │         │              └─────┬─────┘  │
│ CONTROL      │          │         └──────────┬─────────┘       │
│ ├ Branch     │          │                    ▼                  │
│ ├ Switch     │          │             ┌───────────┐            │
│ ├ Parallel   │          │             │   Store   │            │
│ └ Loop       │          │             └───────────┘            │
└──────────────┘          └────────────────────────────────────────┘

[Save Workflow] [Test Run] [Deploy] [Version History]
```

### Node Configuration Panel

```
NODE CONFIGURATION: Assess Quality
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: ai_decision.assess_quality

INPUTS:
┌─────────────────────────────────────┐
│ content:  {{fetch.raw_content}}     │ [Select source ▼]
│ metadata: {{fetch.metadata}}        │ [Select source ▼]
└─────────────────────────────────────┘

CONFIG:
┌─────────────────────────────────────┐
│ Model: [Claude 3 Sonnet ▼]          │
│ Temperature: [0.2]                  │
│ Custom prompt: [Edit...]            │
└─────────────────────────────────────┘

OUTPUTS:
┌─────────────────────────────────────┐
│ quality_score      → (auto)         │
│ characteristics    → (auto)         │
│ recommended_path   → (auto)         │
│ ocr_quality        → route_quality  │
└─────────────────────────────────────┘

ROUTING (for Switch node downstream):
┌─────────────────────────────────────┐
│ ocr_quality = "good"    → chunk     │
│ ocr_quality = "poor"    → enhance   │
│ ocr_quality = "unusable"→ re_ocr    │
└─────────────────────────────────────┘

[Delete Node] [Duplicate] [Save]
```

---

## Features

### MVP (Phase 1)

**Fixed pipelines**
- 2-3 hardcoded pipelines for common cases
- Standard book, classical text, simple document
- No visual builder

**Basic AI decisions**
- Quality assessment
- Language detection
- Route selection

**Core nodes**
- Fetch, OCR, chunk, embed, store
- Basic entity extraction

### Phase 2

**Visual workflow builder**
- Drag-and-drop interface
- Node configuration
- Connection visualization

**Full node library**
- All processing nodes
- All AI decision nodes
- Integration nodes

**Custom pipelines**
- Save custom workflows
- Share workflows
- Version control

### Phase 3 (Dream)

**Pipeline marketplace**
- Community-contributed pipelines
- Specialized workflows (papyri, medieval, etc.)

**Advanced AI**
- Fine-tuned models for specific tasks
- Learning from corrections
- Confidence calibration

**Real-time monitoring**
- Pipeline execution visualization
- Performance metrics
- Error analysis

---

## Open Questions

- **Node execution**: Serverless functions? Container jobs? Queue workers?

- **State persistence**: How to handle long-running pipelines that span hours?

- **Version control**: How to version workflows? Handle breaking changes?

- **Testing**: How to test pipelines before deployment?

- **Cost tracking**: How to track/limit AI API costs per pipeline run?

---

## Dependencies

- **02-data-model.md**: Core Data vs Frame Data - extracted claims become Core Data
- **07-extraction-pipeline.md**: Original pipeline concepts (this supersedes)
- **11-frames-namespaces.md**: Placements added during review, not extraction
- **17-tech-stack.md**: Infrastructure for execution
- **21-source-reader.md**: Trigger for pipeline execution

---

## Summary

The node-based pipeline architecture handles the diversity of historical sources by making processing **adaptive**. AI decision nodes examine content and route it through appropriate paths. Each document type — pristine text, damaged OCR, structured XML, mixed media — gets the processing it needs.

The visual workflow builder (Phase 2+) lets us create and modify pipelines without code changes. Community members could eventually contribute specialized pipelines for niche source types.

This is how we process the messy reality of historical documents at scale.
