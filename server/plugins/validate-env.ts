import { serverEnv } from '../utils/env'

export default defineNitroPlugin(() => {
  void serverEnv
})
