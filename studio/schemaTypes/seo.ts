import {defineField, defineType} from 'sanity'

export const seoType = defineType({
  name: 'seo',
  title: 'SEO metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Defaults to the post title when left empty.',
      validation: (rule) => rule.max(60).warning('Keep meta titles at 60 characters or fewer.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Defaults to the post excerpt when left empty.',
      validation: (rule) =>
        rule.max(160).warning('Keep meta descriptions at 160 characters or fewer.'),
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'Only set this when another URL is the canonical version.',
      validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: false}),
    }),
    defineField({
      name: 'noIndex',
      title: 'Exclude from search engines',
      type: 'boolean',
      description: 'Adds a noindex directive to the published page.',
      initialValue: false,
    }),
  ],
})
