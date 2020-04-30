import { DeepstreamPlugin, DeepstreamServices, EVENT } from '@deepstream/types'
import { S3SyncOptions, S3Sync } from './s3-sync'

interface AWSPluginOptions {
    accessKeyId?: string,
    secretAccessKey?: string,
    services: Array<{
        type: 's3-sync',
        options: S3SyncOptions
    }>
}

export default class AWSPlugin extends DeepstreamPlugin {
    public description = 'AWS Plugin'
    private logger = this.services.logger.getNameSpace('AWS_PLUGIN')
    private plugins: DeepstreamPlugin[] = []

    constructor (private options: AWSPluginOptions = { services: [] }, private services: Readonly<DeepstreamServices>) {
        super()
        this.options.services = this.options.services || []
    }

    public init () {
        if (this.options.services.length === 0) {
            this.logger.fatal(EVENT.CONFIG_ERROR, 'No services defined for AWS plugin')
        }
        this.plugins = this.options.services.map((service) => {
            switch (service.type) {
                case 's3-sync':
                    return new S3Sync(service.options, this.services, {
                        secretAccessKey: this.options.secretAccessKey,
                        accessKeyId: this.options.accessKeyId
                    })
                default:
                    this.logger.fatal(EVENT.CONFIG_ERROR, 'Invalid AWS plugin config')
                    throw new Error() // Needed to let typescript know app will have exited
            }
        })
        this.plugins.forEach((plugin) => plugin.init!())
    }

    public async whenReady (): Promise<void> {
        const promises = this.plugins.map((plugin) => plugin.whenReady())
        await Promise.all(promises)
    }

    public async close (): Promise<void> {
        const promises = this.plugins.map((plugin) => plugin.close())
        await Promise.all(promises)
    }
}