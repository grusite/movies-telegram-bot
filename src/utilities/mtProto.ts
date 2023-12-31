// @ts-ignore
import MTProto from '@mtproto/core'
// @ts-ignore
import { sleep } from '@mtproto/core/src/utils/common'

const api_id = 28438201
const api_hash = '896f88524292d8afbec3860ff9148a9d'

class MTProtoAPI {
  mtproto: MTProto

  constructor() {
    this.mtproto = new MTProto({
      api_id,
      api_hash,
      test: true,

      storageOptions: {
        path: '../storage.json',
      },
    })
  }

  async call(method: string, params: unknown, options = {}): Promise<any> {
    try {
      const result = await this.mtproto.call(method, params, options)

      return result
    } catch (err) {
      const error = err as TelegramBotError;
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

export const api = new MTProtoAPI()

export async function getUser() {
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

export function sendCode(phone: string) {
  return api.call('auth.sendCode', {
    phone_number: phone,
    settings: {
      _: 'codeSettings',
    },
  })
}

export function signIn({ code, phone, phone_code_hash }: { code: string; phone: string; phone_code_hash: string }) {
  return api.call('auth.signIn', {
    phone_code: code,
    phone_number: phone,
    phone_code_hash: phone_code_hash,
  })
}

export function signUp({ phone, phone_code_hash }: { phone: string; phone_code_hash: string }) {
  return api.call('auth.signUp', {
    phone_number: phone,
    phone_code_hash: phone_code_hash,
    first_name: 'MTProto',
    last_name: 'Core',
  })
}

export function getPassword() {
  return api.call('account.getPassword', {})
}

export function checkPassword({ srp_id, A, M1 }: { srp_id: string; A: string; M1: string }) {
  return api.call('auth.checkPassword', {
    password: {
      _: 'inputCheckPasswordSRP',
      srp_id,
      A,
      M1,
    },
  })
}

export async function auth() {
  const user = await getUser()

  const phone = '+9996612222'
  const code = 'XXXXXX'

  if (!user) {
    const { phone_code_hash } = await sendCode(phone)

    try {
      const signInResult = await signIn({
        code,
        phone,
        phone_code_hash,
      })

      if (signInResult._ === 'auth.authorizationSignUpRequired') {
        await signUp({
          phone,
          phone_code_hash,
        })
      }
    } catch (err) {
      const error = err as TelegramBotError;
      if (error.error_message !== 'SESSION_PASSWORD_NEEDED') {
        console.log(`error:`, error)

        return
      }

      // 2FA

      const password = 'USER_PASSWORD'

      const { srp_id, current_algo, srp_B } = await getPassword()
      const { g, p, salt1, salt2 } = current_algo

      const { A, M1 } = await api.mtproto.crypto.getSRPParams({
        g,
        p,
        salt1,
        salt2,
        gB: srp_B,
        password,
      })

      const checkPasswordResult = await checkPassword({ srp_id, A, M1 })
      console.log('checkPasswordResult:', checkPasswordResult)
    }
  }
}

export async function getUpdates() {
  try {
    const state = await api.call('updates.getState', {})
    const updates = await api.call('updates.getDifference', {
      pts: state.pts,
      date: state.date,
      qts: state.qts,
    })

    // Loop through and process the updates
    updates.updates.forEach((update: any) => {
      if (update._ === 'updateNewChannelMessage') {
        if (update.message.to_id.channel_id == '-1002117099816') {
          console.log('New message:', update.message)
        }
      }
    })
  } catch (error) {
    console.error('Failed to get updates:', error)
  }
}

export async function getAllMessages() {
  const resolvedPeer = await api.call('contacts.resolveUsername', {
    username: 'mtproto_core',
  })

  const channel = resolvedPeer.chats.find((chat: any) => chat.id === resolvedPeer.peer.channel_id)

  const inputPeer = {
    _: 'inputPeerChannel',
    channel_id: channel.id,
    access_hash: channel.access_hash,
  }

  const LIMIT_COUNT = 10
  const allMessages: string[] = []

  const firstHistoryResult = await api.call('messages.getHistory', {
    peer: inputPeer,
    limit: LIMIT_COUNT,
  })

  const historyCount: number = firstHistoryResult.count

  for (let offset = 0; offset < historyCount; offset += LIMIT_COUNT) {
    const history = await api.call('messages.getHistory', {
      peer: inputPeer,
      add_offset: offset,
      limit: LIMIT_COUNT,
    })

    allMessages.push(...history.messages)
  }

  console.log('allMessages:', allMessages)
}

type TelegramBotError = {
  error_code: number
  error_message: string
}
