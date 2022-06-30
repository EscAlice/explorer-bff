import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { pingHandler } from './handlers/ping-handler'
import { clusterStatusHandler } from './handlers/cluster-status-handler'
import { statusHandler } from './handlers/status-handler'
import { websocketHandler } from './handlers/ws-handler'
import { websocketRpcHandler } from './handlers/rpc-handler'
import { explorerConfigurationHandler } from './handlers/explorer-configuration-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()

  router.get('/ping', pingHandler)

  router.get('/cluster-status', clusterStatusHandler)
  router.get('/explorer-configuration', explorerConfigurationHandler)
  router.get('/status', statusHandler)
  router.get('/ws', websocketHandler)
  router.get('/rpc', websocketRpcHandler)

  return router
}
