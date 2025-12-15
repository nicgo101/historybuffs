# Federation Future

## Overview

This document describes a **Phase 3+ vision** — not for immediate implementation, but to inform architectural decisions now that don't foreclose future decentralization.

The goal: a system that can't be shut down, where data lives everywhere, and where no single authority controls historical knowledge.

---

## Why Federation?

### Resilience
A centralized platform can be:
- Shut down by corporate decision
- Seized by governments
- Lost to infrastructure failure
- Captured by hostile interests

Federated data survives because it exists in many places, controlled by many parties.

### Trust
Our mission is questioning centralized authority over historical narratives. A centralized platform controlling that data is philosophically inconsistent.

### Sustainability
Multiple funding sources, multiple hosting providers, multiple communities — if one fails, others continue.

### Censorship Resistance
Different jurisdictions, different hosts, different instances. What one authority suppresses, another preserves.

---

## Open Source Licensing Strategy

### License Choice

The project uses a **source-available/copyleft license** (e.g., AGPL, SSPL, or similar) that:
- Allows full source code access and modification
- Permits non-commercial and academic use freely
- Requires commercial SaaS providers to contribute back or license commercially
- Prevents competitors from taking the code and offering a competing commercial service

```yaml
license_goals:
  open_access:
    goal: "Anyone can read, study, and learn from the code"
    achieved: "Full source available"

  community_use:
    goal: "Individuals, academics, researchers can run their own instances"
    achieved: "Free to use non-commercially"

  contribution_requirement:
    goal: "Improvements flow back to the community"
    achieved: "Copyleft requires sharing modifications"

  commercial_protection:
    goal: "Prevent exploitation by well-funded competitors"
    achieved: "Commercial SaaS use requires licensing or full open-sourcing"
```

### Impact on Federation

The license choice directly supports the federation model:

```
FEDERATION + LICENSING ALIGNMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instance Type          License Status              Allowed?
─────────────────────────────────────────────────────────────
Academic/University    Non-commercial use          Yes, freely
Personal/Self-hosted   Non-commercial use          Yes, freely
Regional community     Non-commercial use          Yes, freely
Archive/Preservation   Non-commercial use          Yes, freely

Commercial competitor  Must open-source stack      Deterred
                       OR obtain commercial license

Flagship (us)          Commercial license holder   Yes
Partner instances      Commercial license          Negotiated
```

### Why This Matters for Federation

```yaml
prevents_embrace_extend:
  problem: "Large company takes code, adds proprietary features, dominates market"
  solution: "Copyleft requires sharing all modifications"

ensures_data_stays_open:
  problem: "Instance locks users in with proprietary extensions"
  solution: "Federation protocol + copyleft keeps data portable"

sustainable_flagship:
  problem: "Can't fund development if anyone can run competing commercial service"
  solution: "Commercial use requires license, funding core development"

community_instances_thrive:
  problem: "Non-commercial instances can't compete with commercial ones"
  solution: "Commercial competitors must open-source OR pay, leveling field"
```

### License Considerations for Protocol

```yaml
protocol_licensing:
  # The federation protocol itself should be open standard
  protocol_spec: "Open specification, freely implementable"
  reference_implementation: "Copyleft (AGPL/SSPL)"

  # This allows:
  interoperability:
    - "Anyone can write compatible software"
    - "Protocol not locked to our implementation"
    - "Academic implementations encouraged"

  # While protecting:
  protection:
    - "Our full-featured implementation"
    - "Commercial SaaS offerings"
    - "Investment in development"
```

---

## Federation Model

### Concept

Like Mastodon, Matrix, or email — multiple instances that interoperate.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Instance A     │   │  Instance B     │   │  Instance C     │
│  (Academic)     │◄─►│  (Alternative)  │◄─►│  (Regional)     │
│                 │   │                 │   │                 │
│  Users          │   │  Users          │   │  Users          │
│  Data (subset)  │   │  Data (subset)  │   │  Data (subset)  │
│  Custom config  │   │  Custom config  │   │  Custom config  │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Federation Layer   │
                    │                      │
                    │  - Shared data sync  │
                    │  - Identity portability│
                    │  - Cross-instance query│
                    └──────────────────────┘
```

### Instance Types

```yaml
flagship:
  description: "Main instance run by the project"
  role: "Default for new users, reference implementation"
  data: "Full dataset"
  funding: "SaaS revenue"
  
academic:
  description: "University or research institution instance"
  role: "Academic credibility, specialized research"
  data: "Full + institution-specific"
  funding: "Institutional"
  
regional:
  description: "Geographic or cultural focus"
  role: "Regional history, local languages"
  data: "Full + regional specialization"
  examples: "European History Instance, Asian History Instance"
  
community:
  description: "Special interest community"
  role: "Focused community as full instance"
  data: "Full Core Data + community-specific frames/placements"
  examples: "Genealogy Instance, Archaeology Instance"
  
personal:
  description: "Self-hosted for individuals/small groups"
  role: "Complete control, privacy, experimentation"
  data: "User choice - can sync from others"
  funding: "Self-funded"
  
archive:
  description: "Read-only preservation instance"
  role: "Data backup, censorship insurance"
  data: "Full snapshot, updated periodically"
  examples: "Internet Archive instance, university archives"
```

---

## Data Synchronization

### What Syncs

```yaml
sync_layers:
  core_data:
    description: "Factoids (raw observations), sources, actors, locations, connections"
    sync_mode: "Full sync across willing instances"
    conflict_resolution: "Timestamp + merge"
    note: "Core Data is frame-independent - benefits all instances"

  frame_data:
    description: "Placements, extensions, anchor chain interpretations"
    sync_mode: "Opt-in per frame"
    note: "Instance can choose which frames to sync"
    examples:
      - "Academic instance syncs mainstream frame"
      - "Alternative instance syncs compressed frame"
      - "Both share same Core Data, different placements"

  community_data:
    description: "Community-specific annotations, reviews, discussions"
    sync_mode: "Opt-in per community"
    note: "Instance can host specific communities"

  lens_data:
    description: "Curated lenses, presentations"
    sync_mode: "Opt-in, follows creator"
    note: "Lenses reference Core Data, portable across instances"

  user_data:
    description: "User profiles, contributions, reputation"
    sync_mode: "Portable identity - user chooses home instance"

  media:
    description: "Images, documents, artifacts"
    sync_mode: "Hash-based deduplication, distributed storage"
```

### Sync Protocol

```python
# Conceptual sync protocol

class FederationSync:
    def __init__(self, instance_id, peer_instances):
        self.instance_id = instance_id
        self.peers = peer_instances
        self.vector_clock = VectorClock()
    
    def announce_update(self, entity_type, entity_id, update):
        """
        Announce an update to peer instances.
        """
        message = {
            'origin': self.instance_id,
            'type': entity_type,
            'id': entity_id,
            'update': update,
            'timestamp': self.vector_clock.tick(),
            'signature': self.sign(update)
        }
        
        for peer in self.peers:
            peer.receive_announcement(message)
    
    def receive_announcement(self, message):
        """
        Receive update from peer.
        """
        # Verify signature
        if not self.verify_signature(message):
            log_invalid_message(message)
            return
        
        # Check if we want this data
        if not self.should_accept(message):
            return
        
        # Apply update with conflict resolution
        self.apply_update(message)
    
    def apply_update(self, message):
        """
        Apply update with conflict resolution.
        """
        existing = self.get_entity(message['type'], message['id'])
        
        if not existing:
            # New entity, just create
            self.create_entity(message)
        else:
            # Conflict resolution
            resolved = self.resolve_conflict(existing, message)
            self.update_entity(resolved)
    
    def resolve_conflict(self, existing, incoming):
        """
        Resolve conflicting updates.
        """
        # For most entities: last-write-wins with merge
        if incoming['timestamp'] > existing['timestamp']:
            return self.merge(existing, incoming)
        else:
            return existing  # Keep existing, but note conflict
```

### Conflict Resolution

```yaml
conflict_strategies:
  factoids:
    strategy: "merge_with_history"
    description: "Both versions kept in history, latest shown by default"
    user_option: "View all versions"
    
  sources:
    strategy: "merge_metadata"
    description: "Combine metadata, keep all links"
    
  connections:
    strategy: "union"
    description: "Keep all connections from all instances"
    
  confidence_scores:
    strategy: "recalculate"
    description: "Each instance calculates own confidence"
    note: "Scores may differ across instances"
    
  user_reputation:
    strategy: "instance_local"
    description: "Each instance tracks own reputation"
    note: "Can import reputation when user migrates"
```

---

## Identity Portability

### User Identity

Users have a "home instance" but can interact across the federation.

```
USER IDENTITY: @historian@instance-a.org

Home instance: instance-a.org
├── Profile stored here
├── Reputation calculated here
├── Contributions attributed here
└── Can be exported/migrated

Cross-instance activity:
├── Can view data on any federated instance
├── Can contribute to any accepting instance
├── Contributions sync back to home
└── Reputation portable (with verification)
```

### Identity Protocol

```python
class FederatedIdentity:
    def __init__(self, username, home_instance):
        self.username = username
        self.home_instance = home_instance
        self.full_id = f"@{username}@{home_instance}"
        self.keypair = generate_keypair()
    
    def sign_action(self, action):
        """
        Sign an action with user's private key.
        """
        return {
            'action': action,
            'actor': self.full_id,
            'timestamp': now(),
            'signature': sign(action, self.keypair.private)
        }
    
    def verify_remote_action(self, signed_action):
        """
        Verify action from remote user.
        """
        # Fetch public key from user's home instance
        public_key = fetch_public_key(signed_action['actor'])
        
        # Verify signature
        return verify(
            signed_action['action'],
            signed_action['signature'],
            public_key
        )
```

### Migration

Users can move between instances:

```
MIGRATION PROCESS:

1. User requests migration from Instance A to Instance B

2. Instance A exports:
   ├── Profile data
   ├── Contribution history
   ├── Reputation record
   └── Cryptographic proof of identity

3. Instance B imports:
   ├── Verifies proof
   ├── Creates account
   ├── Optionally imports reputation
   └── Updates federation: "This user now lives here"

4. Instance A options:
   ├── Keep redirect for old @username@instance-a
   ├── Forward notifications
   └── Eventually delete after grace period

5. Other instances update:
   └── @username now resolves to Instance B
```

---

## Cross-Instance Queries

### Query Routing

```python
class FederatedQuery:
    def __init__(self, local_instance, federation_registry):
        self.local = local_instance
        self.federation = federation_registry
    
    def search(self, query, scope='local'):
        """
        Search with federation scope.
        """
        if scope == 'local':
            return self.local.search(query)
        
        elif scope == 'federated':
            # Query all federated instances
            results = [self.local.search(query)]
            
            for peer in self.federation.active_peers():
                peer_results = peer.remote_search(query)
                results.append(peer_results)
            
            return self.merge_results(results)
        
        elif scope == 'specific':
            # Query specific instances
            pass
    
    def get_entity(self, entity_type, entity_id, source_instance=None):
        """
        Get entity, potentially from remote instance.
        """
        if source_instance and source_instance != self.local.id:
            return self.federation.fetch_from(
                source_instance, entity_type, entity_id
            )
        
        # Try local first
        local_result = self.local.get(entity_type, entity_id)
        if local_result:
            return local_result
        
        # Fall back to federation search
        return self.federation.find_entity(entity_type, entity_id)
```

### Instance Discovery

```yaml
discovery_methods:
  registry:
    description: "Central registry of instances (optional)"
    pros: "Easy discovery"
    cons: "Central point of failure/control"
    
  dns_based:
    description: "Well-known DNS records"
    example: "_historytool._tcp.instance.org"
    pros: "Decentralized"
    cons: "Requires DNS control"
    
  peer_exchange:
    description: "Instances share known peers"
    pros: "Fully decentralized"
    cons: "Slower discovery"
    
  manual:
    description: "User adds instance URLs"
    pros: "Complete control"
    cons: "User effort required"
```

---

## Governance

### Instance Governance

Each instance governs itself:

```yaml
instance_governance:
  content_policy:
    description: "What content is allowed"
    note: "Instance can be stricter or more permissive"

  federation_policy:
    description: "Which instances to federate with"
    options:
      - "Open (federate with all)"
      - "Allowlist (specific approved instances)"
      - "Blocklist (exclude problematic instances)"

  frame_policy:
    description: "Which frames to host/sync"
    example: "Academic instance might only sync mainstream frame"

  community_policy:
    description: "Which communities to host"
    example: "Genealogy instance hosts Genealogy Network community"
```

### Cross-Instance Governance

```yaml
federation_agreements:
  minimum_standards:
    description: "What all instances agree to"
    examples:
      - "No illegal content"
      - "Attribution maintained"
      - "Data format compatibility"
      
  dispute_resolution:
    description: "How to handle disagreements"
    options:
      - "Defederate (stop syncing)"
      - "Community discussion"
      - "Fork"
      
  protocol_evolution:
    description: "How the protocol changes"
    process: "RFC process, rough consensus"
```

---

## Architectural Implications (For Now)

### Design Decisions Now That Enable Federation Later

```yaml
entity_ids:
  current: "UUID"
  future_compatible: "UUID@instance_domain"
  action: "Use UUIDs now; prefix with instance later"
  
api_design:
  principle: "Design APIs as if they'll be cross-instance"
  example: "GET /factoids/{id} works same locally or remotely"
  
data_format:
  principle: "Use standard, portable formats"
  choices:
    - "JSON-LD for linked data"
    - "Standard datetime formats"
    - "Content-addressed storage for media"
    
authentication:
  principle: "Design for portable identity"
  current: "Standard auth (Supabase)"
  future: "Add ActivityPub-style signatures"
  
sync_design:
  principle: "Every entity has timestamp + origin"
  fields_to_add:
    - "created_at, updated_at (already have)"
    - "origin_instance (add when federating)"
    - "version_vector (add when federating)"
```

### What To Build Now

```yaml
phase_1_now:
  - Standard REST API
  - UUID-based entity IDs
  - Timestamps on all entities
  - Export functionality
  - Standard data formats
  
phase_2_preparation:
  - Add origin tracking field (nullable)
  - Implement data export/import
  - Design sync-friendly schemas
  - Consider eventual consistency patterns
  
phase_3_federation:
  - Implement sync protocol
  - Add federation layer
  - Identity portability
  - Cross-instance queries
```

---

## Risks and Challenges

### Technical Challenges

```yaml
consistency:
  challenge: "Eventual consistency is complex"
  mitigation: "Design for it from start; accept some divergence"
  
conflicts:
  challenge: "Conflicting edits across instances"
  mitigation: "Merge-friendly data structures; version history"
  
spam:
  challenge: "Bad actors in open federation"
  mitigation: "Instance reputation; allowlists; human verification"
  
performance:
  challenge: "Cross-instance queries are slow"
  mitigation: "Local caching; async sync; query routing"
```

### Social Challenges

```yaml
fragmentation:
  challenge: "Instances diverge, community splits"
  mitigation: "Strong core protocol; shared values; bridges"
  
capture:
  challenge: "One instance dominates, re-centralizes"
  mitigation: "Protocol ensures data portability; easy to leave"
  
quality:
  challenge: "Low-quality instances pollute federation"
  mitigation: "Instance reputation; selective federation; filtering"
  
governance:
  challenge: "Who decides protocol changes?"
  mitigation: "Rough consensus; reference implementation; community process"
```

---

## Timeline

```
NOW (Phase 1-2):
├── Build centralized version
├── Prove concept
├── Build community
├── Make architecture federation-ready
└── Document protocol intentions

LATER (Phase 3):
├── Implement sync protocol
├── Launch second instance (internal test)
├── Open federation to trusted partners
├── Refine based on experience
└── Document and publish protocol

EVENTUALLY:
├── Open federation widely
├── Support self-hosting
├── Transition governance to community
└── Flagship becomes one instance among many
```

---

## Open Questions

- **Economic model**: How do federated instances fund themselves? Coordination?

- **Quality control**: How to maintain quality across instances with different standards?

- **Search**: Federated search is hard. Centralized index? Distributed search?

- **Media**: Large files are expensive to replicate. CDN? Selective sync?

- **Identity**: Full ActivityPub compatibility? Custom protocol?

- **License enforcement**: How to ensure federated instances comply with license? Honor system? Technical measures?

- **Commercial partners**: How to handle commercial instances that want to federate? Licensing tiers?

---

## Dependencies

- **02-data-model.md**: Schema must be sync-friendly, Core Data vs Frame Data separation
- **09-users-community.md**: Community model for federated communities
- **11-frames-namespaces.md**: Frame system for federated frame sync
- **17-tech-stack.md**: Technology choices affect federation options
- **18-business-model.md**: Economic implications of federation and licensing

---

## Summary

Federation is the end-game for a project that questions centralized authority over historical knowledge. By designing now with federation in mind, we don't foreclose that future.

**Key synergies:**
- **Open source (copyleft)** ensures the code stays open and improvements flow back
- **Core Data model** ensures factoids sync universally, frames sync optionally
- **License protection** prevents commercial exploitation while enabling community instances
- **Federation protocol** is open standard, anyone can implement

The data, the community, the mission — they can survive any single point of failure. Commercial sustainability comes from the flagship instance and partner licenses, not from locking up the code or data.

The truth doesn't belong to any one authority. Neither should the tools to explore it.
