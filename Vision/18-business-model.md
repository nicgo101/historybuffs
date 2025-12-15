# Business Model

## Overview

**Core philosophy**: Open source the code, sustain through value-add services.

The code is open. The moat is the data, the community, the extracted knowledge, and the convenience. Users pay for what's hard to replicate, not for artificial scarcity.

---

## Model: Open Core + SaaS

### What's Open Source

```yaml
open_source_components:
  core_database_schema:
    description: "Full schema definitions"
    license: "AGPL-3.0"
    
  extraction_pipeline:
    description: "Code for AI-assisted extraction"
    license: "AGPL-3.0"
    
  basic_frontend:
    description: "Functional web interface"
    license: "AGPL-3.0"
    
  api_definitions:
    description: "Full API specification"
    license: "AGPL-3.0"
    
  self_hosting_docs:
    description: "Instructions to run your own instance"
    license: "CC-BY"
```

### What's SaaS Value

```yaml
saas_value:
  pre_loaded_data:
    description: "Months/years of extraction work already done"
    effort_to_replicate: "Massive"
    
  ai_processing:
    description: "AI extraction, embeddings, generation included"
    cost_to_replicate: "$$$$ in API costs"
    
  community:
    description: "Active contributors, verifiers, researchers"
    impossible_to_replicate: "True"
    
  compute:
    description: "Fast search, graph analysis, pattern detection"
    cost_to_replicate: "Infrastructure expense"
    
  updates:
    description: "Continuous new sources, schema improvements"
    effort_to_replicate: "Ongoing work"
    
  convenience:
    description: "Just works, no maintenance"
    value: "Time savings"
```

---

## Pricing Tiers

### Free Tier

```yaml
name: "Explorer"
price: "$0/month"

includes:
  - Full data exploration
  - Search and browse all factoids
  - View source trees and confidence
  - Basic timeline views
  - Basic map views
  - Join public communities
  - Limited contributions (5/month verified)
  - Basic exports (watermarked)
  - Community support

purpose: "Attract users, build community, demonstrate value"

limitations:
  - Contribution cap
  - No API access
  - Watermarked exports
  - No AI generation credits
  - No presentation mode
```

### Researcher Tier

```yaml
name: "Researcher"
price: "$15/month ($144/year - 20% discount)"

includes:
  - Everything in Free
  - Unlimited contributions
  - Full verification queue access
  - API access (rate limited)
  - Advanced search (semantic, filters)
  - Custom reference frames
  - Create private communities
  - Create custom lenses (curated views)
  - Export without watermark
  - 50 AI generation credits/month
  - Email support

target: "Serious amateur researchers, genealogists, students"

value_proposition: "Unlimited contribution, API access, no watermarks"
```

### Creator Tier

```yaml
name: "Creator"
price: "$39/month ($374/year - 20% discount)"

includes:
  - Everything in Researcher
  - Full presentation mode
  - Timeline animator
  - Map storyteller
  - HD/4K exports
  - 200 AI generation credits/month
  - Priority rendering queue
  - Collaboration features (share projects)
  - Creator profile page
  - Analytics on embed views
  - Priority support

target: "YouTubers, educators, documentary makers"

value_proposition: "Professional presentation tools, high volume generation"
```

### Team Tier

```yaml
name: "Team"
price: "$99/month ($950/year - 20% discount)"

includes:
  - Everything in Creator
  - Up to 5 team members
  - Shared workspace
  - Team communities
  - 500 AI generation credits/month (shared)
  - White-label embed option
  - Custom branding on exports
  - Priority support
  - Quarterly review calls

target: "Small research groups, educational institutions, production teams"
```

### Enterprise/Institutional

```yaml
name: "Enterprise"
price: "Custom pricing"

includes:
  - Everything in Team
  - Unlimited team members
  - Dedicated instance option
  - Custom integrations
  - SLA guarantees
  - SSO/SAML
  - Bulk data access
  - Training and onboarding
  - Dedicated support contact
  - Custom AI model fine-tuning

target: "Universities, museums, media companies, archives"

engagement: "Contact sales, custom proposal"
```

---

## Revenue Projections

### Year 1 (MVP + Launch)

```yaml
assumptions:
  launch: "Month 3"
  free_users_eoy: 5000
  researcher_conversions: "3%"
  creator_conversions: "1%"

projections:
  researcher: "150 users × $15 = $2,250/month"
  creator: "50 users × $39 = $1,950/month"
  
  monthly_revenue: "$4,200"
  annual_revenue: "$37,800 (partial year)"

costs:
  infrastructure: "$300/month"
  ai_apis: "$500/month"
  total_costs: "$800/month"
  
net: "+$3,400/month → Sustainable but not profitable"
```

### Year 2 (Growth)

```yaml
assumptions:
  free_users_eoy: 25000
  researcher_conversions: "4%"
  creator_conversions: "1.5%"
  team_conversions: "0.2%"

projections:
  researcher: "1000 × $15 = $15,000/month"
  creator: "375 × $39 = $14,625/month"
  team: "50 × $99 = $4,950/month"
  
  monthly_revenue: "$34,575"
  annual_revenue: "$414,900"

costs:
  infrastructure: "$2,000/month"
  ai_apis: "$3,000/month"
  team: "$10,000/month (part-time help)"
  
  total_costs: "$15,000/month"
  
net: "+$19,575/month → $235K/year profit"
```

### Year 3 (Scale)

```yaml
assumptions:
  free_users: 100000
  enterprise_clients: 5

projections:
  researcher: "4000 × $15 = $60,000/month"
  creator: "1500 × $39 = $58,500/month"
  team: "200 × $99 = $19,800/month"
  enterprise: "5 × $2000 = $10,000/month"
  
  monthly_revenue: "$148,300"
  annual_revenue: "$1.78M"

status: "Real company with team, reinvestment in product"
```

---

## Monetization Details

### AI Credits System

```yaml
credit_costs:
  text_extraction: "1 credit per 1000 tokens processed"
  embedding_search: "0.1 credits per query"
  image_generation: "5 credits per image"
  video_export: "10 credits per minute (HD)"
  
credit_values:
  researcher: "50 credits = ~10 images or 50K tokens"
  creator: "200 credits = ~40 images or 200K tokens"
  team: "500 credits = ~100 images or 500K tokens"
  
overage:
  price: "$0.10 per credit"
  note: "Only charged if opted in, otherwise feature disabled"
```

### API Pricing

```yaml
tiers:
  researcher:
    rate_limit: "100 requests/minute"
    monthly_cap: "50,000 requests"
    
  creator:
    rate_limit: "300 requests/minute"
    monthly_cap: "200,000 requests"
    
  enterprise:
    rate_limit: "Custom"
    monthly_cap: "Unlimited"

overage: "Contact for high-volume pricing"
```

### Educational Discount

```yaml
discount: "50% off Creator or Team tier"

eligibility:
  - Students with .edu email
  - Teachers and professors
  - Educational institutions
  - Non-profit research organizations
  
verification: "Email verification or institution letter"
```

---

## Competitive Moat

### Why Users Pay (vs. Self-Hosting)

```yaml
core_data:
  description: "Millions of extracted factoids, linked sources (frame-independent)"
  self_host_effort: "Years of work, $$$ in AI costs"

frame_data:
  description: "Placements, interpretations, anchor chains across multiple frames"
  self_host_effort: "Community knowledge work, ongoing curation"
  
community:
  description: "Active contributors, verifiers, researchers"
  self_host_effort: "Impossible to replicate"
  
quality:
  description: "Curated, verified, confidence-scored"
  self_host_effort: "Massive ongoing effort"
  
updates:
  description: "New sources, schema improvements, features"
  self_host_effort: "Full-time development"
  
compute:
  description: "Fast search, real-time sync, AI processing"
  self_host_effort: "$$$$ in infrastructure"
  
convenience:
  description: "Sign up and use immediately"
  self_host_effort: "Days/weeks of setup"
```

### Why Users Stay

```yaml
network_effects:
  - More users → more contributions → more value
  - More data → better AI suggestions → easier contribution
  - More creators → more content → more users
  
switching_costs:
  - Contribution history
  - Reputation built
  - Community connections
  - Custom frames, lenses, and communities
  - Presentation templates
  
continuous_improvement:
  - New features
  - More extracted sources
  - Better AI models
  - Community-driven enhancements
```

---

## Alternative Revenue Streams

### Future Considerations

```yaml
marketplace:
  description: "Sell premium lenses, themes, templates"
  timeline: "Year 2+"
  
sponsorship:
  description: "Sponsored research expeditions by institutions"
  example: "University sponsors 'Ancient Egypt Month'"
  
licensing:
  description: "License data to commercial users"
  consideration: "Must balance with open access mission"
  
grants:
  description: "Academic and cultural grants"
  targets:
    - "NEH (National Endowment for Humanities)"
    - "Mellon Foundation"
    - "Sloan Foundation"
    
donations:
  description: "Community donations for specific features"
  model: "Open Collective or GitHub Sponsors"
```

---

## Open Source Sustainability

### AGPL License Choice

```yaml
license: "AGPL-3.0"

reasons:
  copyleft: "Modifications must be shared"
  network_clause: "SaaS users must share changes"
  philosophy_aligned: "Transparency is our value"
  prevents_closed_forks: "Can't compete with closed version"
  
implications:
  users_can:
    - "Self-host for personal use"
    - "Modify for own purposes"
    - "Build on top of (with AGPL compliance)"
    
  users_cannot:
    - "Create closed commercial fork"
    - "Offer as SaaS without sharing changes"
```

### Community Sustainability

```yaml
contributor_recognition:
  - Credits in release notes
  - Contributor profiles
  - Free tier upgrades for top contributors
  
sponsored_development:
  - Companies can sponsor features
  - Transparent roadmap influence
  - Feature bounties
  
foundation_future:
  timeline: "Year 3+"
  structure: "Non-profit foundation for governance"
  purpose: "Long-term stewardship separate from commercial entity"
```

---

## Risk Mitigation

### Revenue Risks

```yaml
low_conversion:
  risk: "Users don't convert to paid"
  mitigation: "Ensure free tier demonstrates value; paid features are compelling"
  
competitor:
  risk: "Well-funded competitor emerges"
  mitigation: "Community and data moat; open source builds loyalty"
  
ai_cost_spike:
  risk: "AI API costs increase dramatically"
  mitigation: "Evaluate open source models; adjust pricing; optimize usage"
```

### Open Source Risks

```yaml
fork:
  risk: "Someone forks and competes"
  mitigation: "Data and community don't fork; AGPL prevents closed version"
  
free_rider:
  risk: "Big company uses without contributing"
  mitigation: "AGPL requires changes shared; core value is community not just code"
  
maintenance_burden:
  risk: "Open source community demands exceed capacity"
  mitigation: "Clear contribution guidelines; paid support for enterprises"
```

---

## Success Metrics

### Key Metrics by Phase

```yaml
mvp_phase:
  north_star: "Monthly Active Users (MAU)"
  supporting:
    - "User registrations"
    - "Contributions per user"
    - "Time on site"
    
growth_phase:
  north_star: "Paid Subscribers"
  supporting:
    - "Free → Paid conversion rate"
    - "Churn rate"
    - "Net Promoter Score"
    - "API usage"
    
scale_phase:
  north_star: "Annual Recurring Revenue (ARR)"
  supporting:
    - "Enterprise clients"
    - "Revenue per user"
    - "Contribution velocity"
    - "Data quality metrics"
```

---

## Open Questions

- **Pricing sensitivity**: What price points work for target audience? Survey needed.

- **Feature gating**: Exactly which features should be free vs. paid? Fine line between conversion and goodwill.

- **Enterprise sales**: Do we need salespeople? Or self-serve enterprise?

- **Geographic pricing**: Different pricing for different regions?

- **Lifetime deals**: Offer lifetime access at launch for early supporters?

---

## Dependencies

- **11-frames-namespaces.md**: Frames, Lenses & Communities define feature gating
- **16-federation-future.md**: Federation affects commercial model; licensing alignment
- **17-tech-stack.md**: Infrastructure costs affect pricing; self-hosting capability

---

## Summary

The business model aligns incentives: open source builds trust and community; paid tiers provide sustainable funding; the value users pay for (Core Data, Frame Data, community curation, convenience) can't easily be replicated by self-hosting. Features gate on frames (Researcher+), lenses (Researcher+), and communities (all tiers with varying capabilities).

Free for exploration. Pay for power. Open forever.
