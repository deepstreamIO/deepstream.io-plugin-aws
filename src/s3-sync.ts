import { DeepstreamPlugin, DeepstreamServices, EVENT } from '@deepstream/types'
import { existsSync } from 'fs'
import { Aws } from 'aws-cli-js'

interface S3SyncOptions {
    syncInterval: number
    syncDir: string
    bucketName: string
    bucketRegion: string
}

export default class S3Sync extends DeepstreamPlugin {
    public description = 'S3 Folder Sync'
    private logger = this.services.logger.getNameSpace('S3_FOLDER_SYNC')
    private aws: Aws
    private syncTimeout: NodeJS.Timeout | null = null

    constructor (private options: S3SyncOptions, private services: Readonly<DeepstreamServices>) {
        super()
        this.aws = new Aws()
    }

    public init () {
        if (typeof this.options.syncInterval !== 'number') {
            this.logger.fatal(EVENT.ERROR, 'Invalid or missing "interval"')
        }
        if (this.options.syncInterval < 60000) {
            this.logger.fatal(EVENT.ERROR, 'interval must be above 60000')
        }
        if (typeof this.options.bucketName !== 'string') {
            this.logger.fatal(EVENT.ERROR, 'Invalid or missing "bucketName"')
        }
        if (typeof this.options.bucketRegion !== 'string') {
            this.logger.fatal(EVENT.ERROR, 'Invalid or missing "awsRegion"')
        }
        if (typeof this.options.syncDir !== 'string') {
            this.logger.fatal(EVENT.ERROR, 'Invalid or missing "syncDir"')
        }
        if (existsSync(this.options.syncDir) === false) {
            this.logger.fatal(EVENT.ERROR, 'Sync directory doesn\'t exist')
        }
    }

    public async whenReady (): Promise<void> {
        try {
            await this.aws.command(`aws s3 ls ${this.options.bucketName}`)
        } catch (e) {
            this.logger.fatal(
                EVENT.ERROR,
                `AWS S3 Bucket ${this.options.bucketName} with ${this.options.bucketRegion} does not exist`
            )
        }
        this.syncTimeout = setInterval(() => this.syncDir(), this.options.syncInterval)
    }

    public async close (): Promise<void> {
        clearTimeout(this.syncTimeout!)
    }

    private async syncDir (): Promise<void> {
        try {
            await this.aws.command(`s3 sync -region ${this.options.bucketRegion} ${this.options.syncDir} s3://${this.options.bucketName}`)
            this.logger.info(EVENT.INFO, `Synced directory ${this.options.syncDir} successfully`)
        } catch (err) {
            this.logger.error(EVENT.ERROR, 'Error syncing s3 bucket', err)
        }
    }
}