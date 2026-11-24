import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'galleryEnabled',
      title: 'Manage the public gallery in Sanity',
      type: 'boolean',
      initialValue: false,
      description: 'Turn this on after adding gallery photos. The uploaded photos will replace the current built-in gallery.'
    }),
    defineField({
      name: 'newsEnabled',
      title: 'Manage news and events in Sanity',
      type: 'boolean',
      initialValue: false,
      description: 'Turn this on after adding news or events. Published items will replace the current built-in list.'
    })
  ]
})
