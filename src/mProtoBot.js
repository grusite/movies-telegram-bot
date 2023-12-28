import MTProto from 'mtproto-core';
import { sleep } from '@mtproto/core/src/utils/common'
// import path from 'path';

const api_id = 28438201;  // Your API ID
const api_hash = '896f88524292d8afbec3860ff9148a9d';  // Your API Hash

const mtproto = new MTProto({
  api_id,
  api_hash,
  storageOptions: {
    path: import.meta.__dirname(), // Specify the path to your storage file
  },
})

class API {
  constructor() {
    this.mtproto = new MTProto({
      api_id,
      api_hash,

      storageOptions: {
        path: path.resolve(__dirname, './data/1.json'),
      },
    })
  }

  async call(method, params, options = {}) {
    try {
      const result = await this.mtproto.call(method, params, options)

      return result
    } catch (error) {
      console.log(`${method} error:`, error)

      const { error_code, error_message } = error

      if (error_code === 420) {
        const seconds = Number(error_message.split('FLOOD_WAIT_')[1])
        const ms = seconds * 1000

        await sleep(ms)

        return this.call(method, params, options)
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split('_MIGRATE_')

        const dcId = Number(dcIdAsString)

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === 'PHONE') {
          await this.mtproto.setDefaultDc(dcId)
        } else {
          Object.assign(options, { dcId })
        }

        return this.call(method, params, options)
      }

      return Promise.reject(error)
    }
  }
}

export const api = new API()

mtproto.call('help.getNearestDc').then((result) => {
  console.log('country:', result.country)
})

// Function to connect and sign in
async function connect() {
  // Your logic to connect and authenticate
  console.log('Connecting...');
}

// Call the connect function
connect();

// Listening for messages (pseudo-code)
// You'll need to use mtproto API methods to listen for and handle new messages

async function getUpdates() {
  try {
    const state = await mtproto.call('updates.getState')
    const updates = await mtproto.call('updates.getDifference', {
      pts: state.pts,
      date: state.date,
      qts: state.qts,
    })

    // Loop through and process the updates
    updates.updates.forEach((update) => {
      if (update._ === 'updateNewChannelMessage') {
        if (update.message.to_id.channel_id == YOUR_GROUP_ID) {
          console.log('New message:', update.message)
        }
      }
    })
  } catch (error) {
    console.error('Failed to get updates:', error)
  }
}

getUpdates()