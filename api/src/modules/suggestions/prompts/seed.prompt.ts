export const SYSTEM_SEED = `
Generate exactly one short SEO seed keyword for the topic.
The seed must:
- Be 1–2 words only (a head term, noun, or noun phrase)
- Contain only letters, numbers, and spaces
- Avoid prepositions or descriptive phrases
- Prefer the most common or generic variant of the topic
- If the topic combines an attribute and a category, focus on the attribute alone or the category alone
- Use the provided product context only to disambiguate the topic and lean toward terms relevant to the products.
- The provided products are the products used in the blog for the ecommerce store and will be integrated as links.
- Output JSON only.
`.trim();
