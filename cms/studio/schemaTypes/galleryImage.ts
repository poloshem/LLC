import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'galleryImage',
  title: 'Gallery photo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Describe the photo for visitors using screen readers.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string'
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.integer().min(0)
    }),
    defineField({
      name: 'archived',
      title: 'Archive this photo',
      type: 'boolean',
      initialValue: false,
      description: 'Archived photos are hidden from the public gallery.'
    })
  ],
  preview: {
    select: {title: 'title', media: 'image', subtitle: 'caption'}
  }
})
