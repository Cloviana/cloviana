import {defineField, defineType} from 'sanity'

export const blogSettingsType = defineType({
  name: 'blogSettings',
  title: 'Blog settings',
  type: 'document',
  fields: [
    defineField({
      name: 'featuredPost',
      title: 'Featured post',
      type: 'reference',
      to: [{type: 'blogPost'}],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Blog settings'}),
  },
})
