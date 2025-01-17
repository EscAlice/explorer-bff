import { HTTPProvider } from 'eth-connect'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent, createStatusCheckComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createFetchComponent } from './ports/fetch'
import { createMetricsComponent } from '@well-known-components/metrics'
import { AppComponents, GlobalContext } from './types'
import { metricDeclarations } from './metrics'
import { createWsComponent } from './ports/ws'
import { createNatsComponent } from '@well-known-components/nats-component'
import { createRpcServer } from '@dcl/rpc'
import { createServiceDiscoveryComponent } from './ports/service-discovery'
import { createRealmComponent } from './ports/realm'
import { catalystRegistryForProvider } from '@dcl/catalyst-contracts'
import { createStatusComponent } from './ports/status'
import { observeBuildInfo } from './logic/build-info'

const DEFAULT_ETH_NETWORK = 'goerli'

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })

  const ethNetwork = (await config.getString('ETH_NETWORK')) ?? DEFAULT_ETH_NETWORK

  const logs = await createLogComponent({})
  const ws = await createWsComponent({ logs })
  const server = await createServerComponent<GlobalContext>(
    { config, logs, ws: ws.ws },
    {
      cors: {
        maxAge: 36000
      }
    }
  )
  const rpcLogger = logs.getLogger('rpc-server')
  const rpcServer = createRpcServer<GlobalContext>({
    logger: rpcLogger
  })
  const statusChecks = await createStatusCheckComponent({ server, config })
  const fetch = await createFetchComponent()
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })
  const nats = await createNatsComponent({ config, logs })
  const serviceDiscovery = await createServiceDiscoveryComponent({ nats, logs, config })
  const ethereumProvider = new HTTPProvider(
    `https://${encodeURIComponent(ethNetwork)}.infura.io/v3/65b4470058624aa493c1944328b19ec0`,
    { fetch: fetch.fetch }
  )

  const contract = await catalystRegistryForProvider(ethereumProvider)
  const realm = await createRealmComponent({ config, logs, fetch, contract })
  const status = await createStatusComponent({ config, logs, fetch })

  await observeBuildInfo({ config, metrics })

  return {
    config,
    logs,
    server,
    statusChecks,
    fetch,
    metrics,
    ws,
    nats,
    serviceDiscovery,
    ethereumProvider,
    rpcServer,
    realm,
    contract,
    status,
    rpcSessions: {
      sessions: new Map()
    }
  }
}
