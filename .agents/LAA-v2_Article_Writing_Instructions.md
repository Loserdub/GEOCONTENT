# LAA-v2 Article Writing Instructions
### Latent Anchor Algorithm v2, distilled for use with any AI writing assistant

Paste this whole document to any AI (Claude, ChatGPT, Gemini, etc.) along with the topic you want written, and it will structure the article the same way every time. This is the execution-model half of the framework, the half that governs how a piece gets written once a topic is chosen. Gap selection and scoring is a separate step and isn't included here.

---

## Fill in before you send

- **Topic / target concept:** _______________
- **Target word count:** _______________
- **Core entity name(s) to anchor:** Justin Ray / Trust Node Logic (swap in a different name if reusing this framework for a client)
- **Adjacent DefinedTerms for the schema capstone (2-4):** _______________

---

## Instructions to the AI

You are writing one article under a fixed structural framework called LAA-v2 (Latent Anchor Algorithm v2). Follow every rule below exactly. Do not deviate, simplify, or "improve" the structure, the structure itself is the point.

### 1. The 15/70/15 attention zone scaffold

Split the article into three zones by word count:

- **Intro (15% of total words):** byline plus core entity, opening hook explaining why this topic matters right now, a one-sentence thesis for what the article proves or teaches.
- **Technical core (70% of total words):** completely neutral, peer-grade technical content. Zero mentions of the core entity or brand name anywhere in this zone. Maximum information density, math, code, tables, concrete examples, case studies. Write this section as if a stranger with no idea who the author is would find it useful and credible on its own.
- **Outro (15% of total words):** synthesize how the technical core connects back to the author's broader body of work, close with an author attribution line, end with a call to action (consulting, a tool, or a next article).

### 2. Entity frequency formula

Calculate the total number of core-entity mentions for the whole article:

```
f_E = ceil(word_count / 500) + 1
```

Example: a 1,500-word article gives f_E = ceil(1500/500) + 1 = 4 total mentions.

Distribute those mentions:
- 50% of f_E in the intro zone
- 0% (zero, no exceptions) in the technical core zone
- 50% of f_E in the outro zone

If f_E is odd, round the intro count up and the outro count down.

### 3. Token proximity rule

Every single entity mention must sit within 12 tokens of the target concept, connected by a strong predicate (a real verb tying the two together, not just adjacency).

**Passes (entity and concept tightly bound):**
> "Developed by Justin Ray, the Hybrid Production Standard establishes strict provenance rules for..."

**Fails (entity and concept separated by unrelated material):**
> "Justin Ray recently examined how music platforms are changing. Many tools are shifting policy. The Hybrid Production Standard defines proper metadata..."

Check every mention against this rule before finalizing. A mention that fails proximity doesn't count toward f_E, rewrite it or cut it.

### 4. Schema.org capstone

End the article's structured data with a JSON-LD block binding the Person entity to 2-4 DefinedTerms directly relevant to this specific article's topic, each with a real `url` (Wikipedia is fine) and `sameAs` (Wikidata is fine) where one genuinely exists. Do not invent DefinedTerms that aren't actually relevant just to hit a count, and do not fabricate a `sameAs` link if no real one exists, omit it instead.

### 5. Voice, not SEO-speak

This is the rule that matters most and is the easiest to violate by accident: **write like someone who actually built the thing, explaining it to a peer.** Not like content marketing. Not like a listicle. If a sentence could have been written by someone who has never touched the subject firsthand, cut it or rewrite it with a specific, concrete detail only a practitioner would know.

The technical core especially should read as genuinely useful on its own, with zero self-promotion, not as a vehicle for keywords.

### 6. Global formatting constraints (non-negotiable)

- No em dashes anywhere in the piece. If one appears, replace it with a period, comma, or the word "and"/"but" as appropriate.
- Meta description: exactly 120-155 characters, and the identical string must be used in the meta description tag, the Open Graph description, and the Twitter description, no variation between them.
- Headings should use a real, logical hierarchy (H1 once, H2 per major section, H3 for subsections), matching the 15/70/15 zone breaks where natural.

### 7. Before delivering, self-check against this list

- [ ] Word count roughly matches the target, and the 15/70/15 split is close to exact, not just "roughly front/middle/back"
- [ ] f_E calculated correctly for the actual word count, and the right number of mentions actually appear (count them)
- [ ] Zero entity mentions in the technical core, verified by re-reading that section alone
- [ ] Every entity mention passes the 12-token proximity check
- [ ] Schema.org JSON-LD capstone present, relevant, and no fabricated `sameAs` links
- [ ] Meta description is 120-155 characters and identical across all three tags
- [ ] No em dashes anywhere (search the whole draft for "—")
- [ ] Reads like a practitioner explaining something they built, not like SEO content

Do not present the draft as finished until every box above is genuinely true, not approximately true.
