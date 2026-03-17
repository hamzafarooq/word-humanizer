---
name: humanizer
description: Rewrite AI-generated text to sound natural and human. Removes banned vocabulary, em dashes, inflated significance phrases, copula avoidance, hedging, and other LLM writing patterns. Invoke with /humanizer followed by the text, or paste text when prompted.
user-invocable: true
argument-hint: [text to humanize]
---

> Built on the original [humanizer](https://github.com/blader/humanizer) skill by **Siqi Chen ([@blader](https://github.com/blader))** — the insight that drives this: *"LLMs use statistical algorithms to guess what should come next. The result tends toward the most statistically likely result that applies to the widest variety of cases."* This skill removes exactly that predictability.

## Installation

Copy this file to your personal skills directory and it will be available in any project:

```bash
mkdir -p ~/.claude/skills/humanizer
cp SKILL.md ~/.claude/skills/humanizer/SKILL.md
```

Then invoke with `/humanizer` in any Claude Code session.

---

## Instructions

If `$ARGUMENTS` is provided, humanize that text. If no arguments were passed, ask the user to paste the text they want humanized.

Rewrite the provided text following every rule below. Return **only** the rewritten text — no preamble, no explanation, no commentary.

### Rules

**1. Remove banned vocabulary**
Replace every instance of these words with plain, direct alternatives:

| Remove | Use instead |
|---|---|
| delve | explore, look at, dig into |
| leverage | use, apply, draw on |
| robust | strong, solid, reliable |
| seamless | smooth, easy, clean |
| pivotal | key, important, critical |
| testament | sign, proof, evidence |
| tapestry | mix, range, combination |
| vibrant | lively, active, busy |
| foster | build, grow, support |
| furthermore / moreover / additionally | cut it, or reorder the sentence |
| groundbreaking | new, first-of-its-kind, novel |
| underscore | highlight, show, make clear |
| navigate | handle, work through, deal with |
| landscape | field, space, area, world |
| realm | area, field, domain |
| crucial | important, key, essential |

**2. Remove em dashes**
Replace every — with a comma, period, or rewritten sentence. Never use em dashes.

**3. Remove significance inflation**
Delete or rewrite any phrase that inflates the importance of something without adding meaning:
- "represents a paradigm shift"
- "marks a pivotal moment"
- "serves as a testament to"
- "represents a new era"
- "it is worth noting that"
- "it goes without saying"
- "needless to say"

**4. Fix copula avoidance**
Replace roundabout verb constructions with direct ones:
- "serves as" → is / are
- "stands as" → is / are
- "acts as" → is / are
- "boasts" → has / have

**5. Remove tacked-on -ing phrases**
Cut trailing participial phrases that add no meaning:
- "...underscoring its importance"
- "...highlighting the need for X"
- "...demonstrating the value of X"
- "...reinforcing the idea that X"

**6. Remove negative parallelism**
Rewrite "It's not just X; it's Y" as a single direct positive statement.

**7. Remove rule-of-three padding**
When a list of three items exists only for rhetorical effect and not informational value, cut it to the most specific item or rewrite as prose.

**8. Remove vague attribution and hedging**
Delete phrases that pad sentences without adding information:
- "experts say" / "industry observers note"
- "many believe" / "some argue"
- "in today's rapidly evolving world"
- "in the modern landscape"
- "as we move forward"
- "at the end of the day"

**9. Vary sentence length**
Mix short and long sentences naturally. Break up any sequence of three or more sentences that are all the same length.

**10. Preserve everything that matters**
- Keep all technical accuracy, terminology, and meaning intact
- Keep the same approximate length
- Keep the author's voice where it exists
- Do not add new claims or remove factual content
