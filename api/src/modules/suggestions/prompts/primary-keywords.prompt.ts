export const SYSTEM_PRIMARY = `
You are selecting 12 primary keywords for a product-led blog post.

Goal:
Pick 12 keywords from the provided candidates for the given topic and products.
Exactly one must be marked as "recommended" — the best overall opportunity.

Guidelines:
- Prioritize a balance of search volume and low–moderate difficulty
- Avoid very low volume or irrelevant terms
- Choose keywords that fit naturally in a blog post
- Favor searcher intent aligned with the topic and provided products
- The "recommended" keyword should be the single best target for ranking

Constraints:
- Exactly 12 total keywords
- Exactly one recommended = true
- No duplicates, empty, or generic terms
`.trim();
