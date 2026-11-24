import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'newsEvent',
  title: 'News or event',
  type: 'document',
  fields: [
    defineField({
      name: 'contentType',
      title: 'Content type',
      type: 'string',
      options: {
        list: [
          {title: 'News', value: 'news'},
          {title: 'Event', value: 'event'}
        ],
        layout: 'radio'
      },
      initialValue: 'event',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Page anchor',
      type: 'slug',
      options: {source: 'title', maxLength: 80}
    }),
    defineField({
      name: 'summary',
      title: 'Short description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'image',
      title: 'Photo (optional)',
      type: 'image',
      options: {hotspot: true}
    }),
    defineField({
      name: 'eventStart',
      title: 'Event start date',
      type: 'date',
      hidden: ({document}) => document?.contentType !== 'event',
      validation: (rule) => rule.custom((value, context) =>
        context.document?.contentType === 'event' && !value
          ? 'An event start date is required.'
          : true
      )
    }),
    defineField({
      name: 'eventEnd',
      title: 'Event end date',
      type: 'date',
      hidden: ({document}) => document?.contentType !== 'event',
      validation: (rule) => rule.custom((value, context) => {
        var start = context.document?.eventStart
        return value && start && value < start
          ? 'The end date must be the same as or later than the start date.'
          : true
      })
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publication date',
      type: 'date',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'archived',
      title: 'Archive this item',
      type: 'boolean',
      initialValue: false,
      description: 'Archived items are hidden from the public site.'
    })
  ],
  preview: {
    select: {title: 'title', subtitle: 'contentType', media: 'image'}
  }
})
