// @ts-ignore
import MTProto from '@mtproto/core'
import { api } from './utilities/mtProto'


const nearestDc = await api.call('help.getNearestDc', {})
console.log(nearestDc.country);

// api.mtproto.updates.on('updatesTooLong', (updateInfo) => {
//   console.log('updatesTooLong:', updateInfo)
// })

// api.mtproto.updates.on('updateShortMessage', (updateInfo) => {
//   console.log('updateShortMessage:', updateInfo)
// })

// api.mtproto.updates.on('updateShortChatMessage', (updateInfo) => {
//   console.log('updateShortChatMessage:', updateInfo)
// })

// api.mtproto.updates.on('updateShort', (updateInfo) => {
//   console.log('updateShort:', updateInfo)
// })

// api.mtproto.updates.on('updatesCombined', (updateInfo) => {
//   console.log('updatesCombined:', updateInfo)
// })

// api.mtproto.updates.on('updates', (updateInfo) => {
//   console.log('updates:', updateInfo)
// })

// api.mtproto.updates.on('updateShortSentMessage', (updateInfo) => {
//   console.log('updateShortSentMessage:', updateInfo)
// })

async function getUser() {
  try {
    const user = await api.call('users.getFullUser', {
      id: {
        _: 'inputUserSelf',
      },
    })

    return user
  } catch (error) {
    return null
  }
}

const user = await getUser()
console.log(user)

// await api.call('messages.sendMessage', {
//   clear_draft: true,

//   peer: {
//     _: 'inputPeerSelf',
//   },
//   message: 'Hello @mtproto_core',
//   entities: [
//     {
//       _: 'messageEntityBold',
//       offset: 6,
//       length: 13,
//     },
//   ],

//   random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
// })