# AI Generation

## Overview

AI image generation is powerful but historically unreliable. Generic AI produces Roman soldiers in medieval armor, Vikings with horned helmets, and ancient cities with modern materials. Our approach: ground generation in the actual historical data, producing images that are as accurate as the sources allow.

---

## Core Principles

### 1. Data-Grounded Generation
Every generated image draws from the factoid database — time period, location, environmental conditions, known artifacts. The prompt is built from evidence, not imagination.

### 2. Accuracy Over Aesthetics
A less dramatic but accurate image beats a stunning but anachronistic one. We optimize for historical fidelity first.

### 3. Uncertainty Is Visible
When we don't know what something looked like, the image reflects that. We don't invent false precision. Options show the range of possibility.

### 4. Source Traceability
Every generated image links back to the factoids and sources that informed it. Users can verify the basis for visual choices.

### 5. Continuous Improvement
Community feedback improves prompts over time. Corrections to generated images feed back into better future generation.

### 6. Frame Awareness
Generated images use the selected frame's temporal placement. A factoid placed at 1200 BCE in mainstream frame vs 200 BCE in compressed frame will generate different period-appropriate material culture. The frame is always documented in image metadata.

---

## User Stories

### Creator
- As a creator, I want historically accurate images, so my content is credible.
- As a creator, I want to see what sources informed the image, so I can verify and cite.
- As a creator, I want multiple variations, so I can choose the best fit.

### Researcher
- As a researcher, I want to visualize artifacts and structures, so I can better understand them.
- As a researcher, I want to see uncertainty reflected, so I don't mistake generation for evidence.
- As a researcher, I want to provide corrections, so future generations improve.

### Educator
- As an educator, I want appropriate images for different periods, so students learn accurate visual representations.
- As an educator, I want to explain why images look this way, so students understand the evidence basis.

---

## Generation Pipeline

### Context Assembly

```python
def assemble_generation_context(request):
    """
    Gather all relevant context for image generation.

    Context comes from two sources:
    - Core Data: The factoid's raw observation, source, location
    - Frame Data: The temporal placement in the selected frame
    """
    context = {}

    # Core request
    context['subject'] = request.subject  # What to generate
    context['factoid_id'] = request.factoid_id  # If tied to specific factoid
    context['frame'] = request.frame  # Which frame's dating to use

    # Get factoid from Core Data
    if request.factoid_id:
        factoid = get_factoid(request.factoid_id)
        context['raw_observation'] = factoid.raw_observation
        context['source'] = get_source(factoid.source_id)

    # Temporal context FROM FRAME (not raw date)
    # The frame determines WHERE in time this event is placed
    if request.factoid_id and request.frame:
        placement = get_placement(request.factoid_id, request.frame)
        if placement:
            context['date'] = placement.year_point
            context['date_confidence'] = placement.confidence
            context['time_period'] = get_time_period(placement.year_point)
            context['era_characteristics'] = get_era_characteristics(
                placement.year_point, request.location
            )
    elif request.date:
        # Manual date override
        context['date'] = request.date
        context['time_period'] = get_time_period(request.date)
        context['era_characteristics'] = get_era_characteristics(request.date, request.location)
    
    # Geographic context
    if request.location_id:
        location = get_location(request.location_id)
        context['geography'] = {
            'terrain': location.terrain_notes,
            'climate': location.climate_notes,
            'architecture_style': get_regional_architecture(location, request.date)
        }
    
    # Environmental context
    if request.date and request.location_id:
        environmental = get_environmental_context(request.location_id, request.date)
        context['environment'] = {
            'weather': environmental.get('weather'),
            'season': environmental.get('season'),
            'time_of_day': environmental.get('time_of_day'),
            'astronomical': environmental.get('astronomical_events')
        }
    
    # Material culture
    context['material_culture'] = {
        'clothing': get_period_clothing(request.date, request.location_id, request.subject_type),
        'weapons': get_period_weapons(request.date, request.location_id) if request.military,
        'tools': get_period_tools(request.date, request.location_id),
        'architecture': get_period_architecture(request.date, request.location_id)
    }
    
    # Related artifacts (visual references)
    context['artifacts'] = get_related_artifacts(request.factoid_id)
    
    # Source basis
    context['sources'] = get_source_descriptions(request.factoid_id)
    
    return context
```

### Prompt Building

```python
def build_generation_prompt(context, style_options):
    """
    Build the image generation prompt from assembled context.
    """
    prompt_parts = []
    
    # Style prefix
    prompt_parts.append(STYLE_PREFIXES[style_options.style])
    
    # Core subject
    prompt_parts.append(f"Scene depicting: {context['subject']}")
    
    # Time period characteristics
    if context.get('time_period'):
        period_desc = describe_period(context['time_period'])
        prompt_parts.append(f"Historical period: {period_desc}")
    
    # Location/setting
    if context.get('geography'):
        geo = context['geography']
        prompt_parts.append(f"Setting: {geo.get('terrain', 'unspecified terrain')}")
        if geo.get('architecture_style'):
            prompt_parts.append(f"Architecture: {geo['architecture_style']}")
    
    # Environmental conditions
    if context.get('environment'):
        env = context['environment']
        if env.get('weather'):
            prompt_parts.append(f"Weather: {env['weather']}")
        if env.get('season'):
            prompt_parts.append(f"Season: {env['season']}")
        if env.get('time_of_day'):
            prompt_parts.append(f"Time: {env['time_of_day']}")
    
    # Material culture details
    if context.get('material_culture'):
        mc = context['material_culture']
        if mc.get('clothing'):
            prompt_parts.append(f"Clothing: {mc['clothing']}")
        if mc.get('weapons'):
            prompt_parts.append(f"Weapons/equipment: {mc['weapons']}")
        if mc.get('architecture'):
            prompt_parts.append(f"Buildings: {mc['architecture']}")
    
    # Negative prompts (anachronisms to avoid)
    negative = build_negative_prompt(context['time_period'], context.get('geography'))
    
    # Style suffix
    prompt_parts.append(STYLE_SUFFIXES[style_options.style])
    
    return {
        'positive': ". ".join(prompt_parts),
        'negative': negative,
        'style_reference': style_options.reference_images
    }
```

### Anachronism Prevention

```python
ANACHRONISM_RULES = {
    'pre_stirrup': {
        'before': 300,  # CE, roughly
        'forbidden': ['stirrups', 'mounted lancers charging'],
        'note': 'Stirrups not yet adopted in this region'
    },
    'pre_gunpowder_europe': {
        'before': 1300,
        'region': 'europe',
        'forbidden': ['guns', 'cannons', 'firearms'],
        'note': 'Gunpowder weapons not yet in Europe'
    },
    'pre_plate_armor': {
        'before': 1350,
        'forbidden': ['full plate armor', 'gothic armor'],
        'note': 'Full plate armor not yet developed'
    },
    'viking_no_horns': {
        'culture': 'norse',
        'forbidden': ['horned helmets'],
        'note': 'No evidence Vikings wore horned helmets in battle'
    },
    'roman_no_medieval': {
        'culture': 'roman',
        'forbidden': ['medieval castles', 'gothic architecture', 'chainmail'],
        'note': 'Medieval elements anachronistic for Roman period'
    },
    # ... hundreds more rules
}

def build_negative_prompt(time_period, geography):
    """
    Build negative prompt to avoid anachronisms.
    """
    negatives = ['modern elements', 'contemporary clothing', 'electric lights']
    
    for rule_name, rule in ANACHRONISM_RULES.items():
        if applies_to_context(rule, time_period, geography):
            negatives.extend(rule['forbidden'])
    
    return ", ".join(negatives)
```

### Material Culture Database

```yaml
# Period-specific material culture

roman_republic:
  period: [-509, -27]
  region: mediterranean
  
  clothing:
    male_citizen: "toga over tunic, leather sandals"
    female_citizen: "stola over tunic, palla shawl"
    military: "lorica hamata (chainmail), bronze helmet, rectangular scutum shield"
    lower_class: "simple tunic, bare feet or simple sandals"
    
  architecture:
    public: "columns (Doric, Ionic), travertine stone, terracotta roofs"
    domestic: "atrium houses, impluvium pools, frescoed walls"
    military: "wooden palisade camps, later stone walls"
    
  weapons:
    standard: "gladius (short sword), pilum (javelin), pugio (dagger)"
    
  colors:
    common: "natural wool (cream, brown), some red and blue dyes"
    elite: "purple trim indicates status"
    
  notes:
    - "No stirrups - cavalry rides without"
    - "Concrete in use but not dominant yet"
    - "Glass expensive and rare"

roman_empire_early:
  period: [-27, 284]
  # ... continues
  
medieval_early:
  period: [500, 1000]
  region: europe
  
  clothing:
    male_noble: "tunic, cloak with brooch, leather boots"
    female_noble: "long dress, head covering, simple jewelry"
    peasant: "rough tunic, bare legs, simple shoes or barefoot"
    
  architecture:
    religious: "Romanesque - thick walls, round arches, small windows"
    castle: "motte and bailey, wooden structures, later stone keeps"
    domestic: "wattle and daub, thatched roofs"
    
  weapons:
    common: "spear, axe, round shield, seax (knife)"
    elite: "sword (pattern-welded), chainmail (rare and precious)"
    
  notes:
    - "Castles mostly wood until later period"
    - "Plate armor does not exist yet"
    - "Colors muted - bright dyes expensive"
```

---

## Generation Modes

### Event Visualization

Generate image of a specific historical event:

```
INPUT: Factoid "Crossing of the Rubicon, January 49 BCE"

CONTEXT ASSEMBLED:
├── Event: Julius Caesar crosses Rubicon with legion
├── Date: January 49 BCE
├── Location: Rubicon River, northern Italy
├── Season: Winter
├── Participants: Caesar, XIII Legion
├── Weather: (no specific record - winter conditions)
├── Material culture: Late Roman Republic military

PROMPT GENERATED:
"Historical painting. Julius Caesar on horseback at a shallow 
river crossing, winter dawn. Roman legionaries in lorica hamata 
(chainmail armor), bronze Montefortino helmets, carrying rectangular 
scuta shields and pila javelins. Bare legs below tunic - no 
pants. Horses without stirrups. Northern Italian landscape, 
winter vegetation, grey dawn light. Classical composition, 
dramatic moment. No medieval elements, no plate armor, 
no stirrups."

OUTPUT:
├── Image generated
├── Accuracy notes:
│   ├── ✓ Armor type correct for period
│   ├── ✓ No stirrups shown
│   ├── ✓ Winter setting
│   ├── ⚠ Exact location of river uncertain
│   └── ⚠ Caesar's exact appearance unknown
├── Sources: Suetonius, Plutarch, Caesar's own writings
└── Confidence: 0.7 (event well-attested, visual details uncertain)
```

### Artifact Reconstruction

Visualize what an artifact might have looked like when new:

```
INPUT: Artifact "Colosseum, as originally constructed"

CONTEXT ASSEMBLED:
├── Structure: Flavian Amphitheater
├── Date: 80 CE (completion)
├── Location: Rome
├── Known features:
│   ├── Travertine exterior
│   ├── Marble seats (some areas)
│   ├── Velarium (cloth awning system)
│   ├── Statues in arches (upper levels)
│   └── Painted/decorated elements
├── Archaeological evidence: Extensive
├── Contemporary descriptions: Multiple sources

PROMPT GENERATED:
"Architectural visualization. Roman Colosseum as newly completed, 
80 CE. Fresh white travertine stone exterior (not weathered). 
Colored marble seats visible through arches. Bronze statues 
in upper arcade niches. Velarium (large cloth awning) partially 
deployed. Colored paint on some decorative elements. Crowds 
in Roman dress entering. Clear Mediterranean sky. 
Photorealistic architectural rendering."

OUTPUT:
├── Image generated
├── Accuracy notes:
│   ├── ✓ Travertine material documented
│   ├── ✓ Velarium system attested
│   ├── ✓ Statues in arches documented
│   ├── ⚠ Exact color scheme uncertain
│   └── ⚠ Statue poses/subjects unknown
├── Sources: Ancient descriptions, archaeological studies
└── Confidence: 0.8 (structure well-documented)
```

### Scene Reconstruction

Visualize daily life or typical scenes:

```
INPUT: "Roman forum, typical day, 1st century CE"

CONTEXT ASSEMBLED:
├── Location: Roman Forum
├── Period: 1st century CE (Imperial)
├── Typical activities:
│   ├── Political speeches
│   ├── Commercial transactions
│   ├── Religious ceremonies
│   ├── Social gathering
│   └── Legal proceedings
├── Architecture: Temples, basilicas, rostra, shops
├── Population: Diverse - senators to slaves

PROMPT GENERATED:
"Historical illustration. Roman Forum on a busy day, 1st 
century CE. Multiple activities: orator speaking from rostra, 
merchants with stalls, citizens in togas conversing, slaves 
carrying goods, women shopping. Temple of Saturn visible, 
Basilica Julia in background. Mix of social classes evident 
in clothing quality. Mediterranean light, marble and 
travertine buildings. Populated scene, authentic Roman life."

OUTPUT:
├── Image generated
├── Accuracy notes:
│   ├── ✓ Building identifications correct
│   ├── ✓ Social mix appropriate
│   ├── ✓ Clothing variety reflects sources
│   ├── ⚠ Exact crowd density unknown
│   └── ⚠ Individual faces/poses fictional
├── Sources: Multiple Roman authors, archaeological evidence
└── Confidence: 0.75 (general scene, specific details uncertain)
```

### Portrait Generation

Generate historical figure portraits (with appropriate caveats):

```
INPUT: "Portrait of Cleopatra VII"

CONTEXT ASSEMBLED:
├── Subject: Cleopatra VII of Egypt
├── Period: 69-30 BCE
├── Known depictions:
│   ├── Coins (profile, stylized)
│   ├── Possible statues (disputed identifications)
│   └── No certain contemporary paintings
├── Contemporary descriptions:
│   ├── Plutarch: "not incomparable beauty" but "charm"
│   ├── Greek-Macedonian heritage
│   └── Various ancient accounts
├── Uncertainty: HIGH - no verified likeness

PROMPT GENERATED:
"Historical portrait. Woman of Greek-Macedonian descent, 
late Ptolemaic Egypt, 1st century BCE. Based on coin imagery: 
prominent nose, strong features. Royal Ptolemaic styling: 
elaborate braided hair, royal diadem, Greek-Egyptian fusion 
dress. Intelligent, charismatic expression. NOT idealized 
Hollywood beauty - historically-grounded interpretation."

OUTPUT:
├── Image generated
├── Accuracy notes:
│   ├── ⚠ No verified likeness exists
│   ├── ✓ Coin imagery referenced for features
│   ├── ✓ Period costume appropriate
│   ├── ⚠ Skin tone uncertain (Greek-Macedonian likely fair but unknown)
│   └── ⚠ Age at depiction unspecified
├── Sources: Coin imagery, Plutarch, archaeological context
├── Confidence: 0.4 (high uncertainty on appearance)
└── NOTE: "This is an interpretation based on limited evidence,
          not a verified likeness."
```

### Lens-Based Batch Generation

Generate images for all key events in a lens:

```python
def generate_for_lens(lens_id, frame_id, style_options, max_images=20):
    """
    Generate images for key factoids in a lens.
    Useful for presentation preparation.
    """
    lens = get_lens(lens_id)
    frame = get_frame(frame_id)

    # Get factoids in this lens that would benefit from images
    factoids = get_lens_factoids(lens_id)
    image_worthy = filter_image_worthy(factoids)  # Events, battles, artifacts

    # Sort by importance/centrality to lens
    prioritized = prioritize_for_generation(image_worthy, max_images)

    results = []
    for factoid in prioritized:
        # Get placement in the selected frame
        placement = get_placement(factoid.id, frame_id)

        request = GenerationRequest(
            factoid_id=factoid.id,
            frame=frame,
            date=placement.year_point if placement else None,
            location_id=factoid.location_id,
            style_options=style_options
        )

        image = generate_historical_image(request)
        results.append({
            'factoid_id': factoid.id,
            'image': image,
            'frame_date': placement.year_point if placement else 'undated',
            'placement_confidence': placement.confidence if placement else None
        })

    return {
        'lens': lens.name,
        'frame': frame.name,
        'images': results,
        'total_generated': len(results)
    }
```

**Example: Generating images for a presentation lens**

```
LENS: "Bronze Age Collapse"
FRAME: Mainstream

Key factoids identified for image generation:
1. Destruction of Ugarit (~1185 BCE)
2. Sea Peoples invasion of Egypt (~1177 BCE)
3. Fall of Hattusa (~1180 BCE)
4. Collapse of Mycenaean palaces (~1200-1150 BCE)

For each: Generate with Late Bronze Age material culture,
Mediterranean geography, collapse-era context.

NOTE: If frame changes to "Compressed", dates shift to ~200 BCE
and material culture references would change dramatically.
```

---

## Uncertainty Handling

### Confidence Levels

```yaml
confidence_levels:
  high:
    range: [0.8, 1.0]
    meaning: "Strong evidence base"
    display: "Historically grounded"
    examples:
      - "Well-documented structures"
      - "Abundant archaeological evidence"
      - "Multiple contemporary descriptions"
      
  medium:
    range: [0.5, 0.8]
    meaning: "Reasonable basis with gaps"
    display: "Interpretation based on available evidence"
    examples:
      - "General period knowledge, specific details uncertain"
      - "Some archaeological evidence"
      - "Later descriptions of earlier events"
      
  low:
    range: [0.2, 0.5]
    meaning: "Significant uncertainty"
    display: "Speculative reconstruction"
    examples:
      - "Limited evidence"
      - "Disputed sources"
      - "Appearance unknown"
      
  speculative:
    range: [0.0, 0.2]
    meaning: "Little to no evidence"
    display: "Imaginative interpretation - minimal evidence"
    examples:
      - "No contemporary depictions"
      - "Legendary/mythological elements"
      - "Prehistoric periods"
```

### Uncertainty Visualization

Show the range of possibility:

```
REQUEST: "What did the Library of Alexandria look like?"

RESPONSE:

⚠️ UNCERTAINTY LEVEL: HIGH
No images of the Library survive. Its exact appearance is unknown.

GENERATED VARIATIONS:

[Image 1] Conservative interpretation
├── Based on: Greek architectural norms
├── Features: Colonnaded portico, reading rooms
├── Confidence: 0.4
└── Note: "Minimal speculation"

[Image 2] Expanded interpretation  
├── Based on: Descriptions of Mouseion complex
├── Features: Gardens, lecture halls, observatory
├── Confidence: 0.3
└── Note: "Includes associated Mouseion complex"

[Image 3] Grand interpretation
├── Based on: Later romantic descriptions
├── Features: Massive hall, endless scrolls
├── Confidence: 0.2
└── Note: "May reflect later idealization"

EVIDENCE BASIS:
├── No contemporary images survive
├── Strabo's description (general)
├── Part of larger Mouseion complex
├── Ptolemaic architectural parallels
└── See source tree for details
```

---

## Feedback Loop

### Community Corrections

```python
def submit_image_correction(image_id, user_id, correction):
    """
    Allow community to correct anachronisms or errors.
    """
    correction_record = ImageCorrection(
        image_id=image_id,
        submitted_by=user_id,
        correction_type=correction.type,
        # anachronism, inaccuracy, missing_element, wrong_style
        description=correction.description,
        evidence=correction.evidence,  # Sources supporting correction
        suggested_fix=correction.suggestion
    )
    
    # Queue for review
    add_to_correction_queue(correction_record)
    
    # If verified, update prompt database
    # to prevent same error in future

def apply_correction_to_prompts(verified_correction):
    """
    Update prompt generation to avoid this error.
    """
    if verified_correction.type == 'anachronism':
        # Add to anachronism rules
        add_anachronism_rule(
            period=verified_correction.period,
            forbidden=verified_correction.incorrect_element,
            correct=verified_correction.correct_element,
            note=verified_correction.explanation
        )
    
    # Regenerate affected prompt templates
    update_material_culture_database(verified_correction)
```

### Prompt Improvement

```python
def track_prompt_performance(image_id, feedback):
    """
    Track which prompts produce accurate/inaccurate results.
    """
    prompt_record = get_prompt_record(image_id)
    
    prompt_record.feedback_count += 1
    
    if feedback.type == 'accurate':
        prompt_record.accuracy_score += 1
    elif feedback.type == 'inaccurate':
        prompt_record.accuracy_score -= 1
        prompt_record.issues.append(feedback.issue)
    
    # Periodically review low-scoring prompts
    if prompt_record.accuracy_score < THRESHOLD:
        queue_for_prompt_review(prompt_record)
```

---

## Features

### MVP (Phase 1)

**Basic generation**
- Manual prompt input
- Period selection affects negative prompts
- Single style option

**Simple context**
- Date-based material culture lookup
- Basic anachronism prevention

### Phase 2

**Full context assembly**
- Automatic context from factoids
- Environmental data integration
- Material culture database

**Multiple variations**
- Generate alternatives
- Confidence display
- Uncertainty visualization

**Community feedback**
- Correction submission
- Accuracy voting
- Prompt improvement loop

### Phase 3 (Dream)

**Advanced accuracy**
- AI-powered anachronism detection
- Cross-reference with artifact images
- Style transfer from period art

**Custom models**
- Fine-tuned on historical art
- Period-specific models
- Regional specialization

**3D generation**
- Artifact reconstruction
- Building walkthroughs
- Scene exploration

---

## Open Questions

- **Model choice**: Which generation model? (Midjourney, DALL-E, Stable Diffusion, etc.)

- **Licensing**: What license for generated images? Can users use commercially?

- **Controversial depictions**: How to handle contested historical appearances? (Skin tones, etc.)

- **Mythological content**: Generate images of legendary/mythological subjects? With what caveats?

- **Cost control**: Generation is expensive. How to limit/price appropriately?

- **Frame-dependent imagery**: Same event in different frames produces different material culture. Should we cache both, or regenerate? Label prominently?

---

## Dependencies

- **02-data-model.md**: Core Data (factoids, artifacts)
- **04-chronology-system.md**: Anchor hierarchy for date confidence
- **05-geographic-system.md**: Location context, regional architecture
- **06-environmental-layer.md**: Weather and conditions
- **11-frames-namespaces.md**: Frame system (determines temporal placement for generation)
- **13-presentation-mode.md**: Integration with presentation tools, lens-based batch generation

---

## Summary

AI generation becomes historically valuable when grounded in evidence. By building prompts from the factoid database, maintaining period-specific material culture knowledge, preventing anachronisms, and showing uncertainty honestly, we produce images that serve education and accuracy rather than perpetuating myths.

The AI sees through our data's eyes. If the data is good, the images are meaningful.
