# Partner Narrative Kit Asset Schema

The prototype uses a structured asset model that can later move into a database with search, source governance and enrichment jobs.

## Core Fields

- `id`
- `title`
- `url`
- `canonical_url`
- `source_type`
- `platform`
- `format`
- `language`
- `region`
- `published_date`
- `last_seen_date`
- `last_crawled_date`
- `raw_text`
- `summary`
- `primary_topic`
- `secondary_topics`
- `audience`
- `business_area`
- `funnel_stage`
- `key_claims`
- `proof_points`
- `suggested_use`
- `suggested_sales_enablement_use`
- `related_asset_ids`
- `ai_confidence_score`
- `metadata_status`
- `content_usefulness`
- `url_status`

## Human Scale Additions

- `message_role`
- `message_spine_alignment`
- `core_truth_supported`
- `provocation_supported`
- `claims_to_avoid`
- `sector_cuts`
- `role_cuts`
- `moments_that_matter`
- `partner_prompt_types`
- `cultural_availability_score`
- `partner_readiness_score`
- `proof_strength_score`
- `moment_readiness_score`
- `activation_quality_total`
- `activation_labels`
- `recommended_partner_use`
- `why_it_matters`

## Future Services

- `source-registry`: stores approved public source locations, review cadence and source ownership.
- `ai-enrichment`: generates editable summaries, taxonomy tags, claims, proof points, partner prompts and activation labels.
- `coverage-engine`: scores topic, sector, role, moment and proof-depth coverage.
- `quality-engine`: scores cultural availability, partner readiness, proof strength, spine alignment and moment readiness.
- `measurement-layer`: prepares readiness fields for recognised thinking, repeated language, saves, forwards, client questions, partner reuse, search visibility and AI answer references.
