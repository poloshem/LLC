import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'llc-church',
  title: "Lord's Last Call Church CMS",
  projectId: '1241w4p9',
  dataset: 'production',
  plugins: [
    deskTool({
      structure: (S) => S.list()
        .title('Church content')
        .items([
          S.documentTypeListItem('galleryImage').title('Gallery photos'),
          S.documentTypeListItem('newsEvent').title('News & events'),
          S.listItem()
            .title('Site settings')
            .child(S.document().schemaType('siteSettings').documentId('siteSettings'))
        ])
    })
  ],
  schema: {
    types: schemaTypes
  }
})
