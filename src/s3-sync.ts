import { DeepstreamPlugin, DeepstreamServices, EVENT } from '@deepstream/types'
import { existsSync } from 'fs'
import { S3 } from 'aws-sdk'
import { Aws } from 'aws-cli-js'

export interface S3SyncOptions {
    syncInterval: number
    syncDir: string
    bucketName: string
    bucketRegion: string
}

export class S3Sync extends DeepstreamPlugin {
    public description = 'S3 Folder Sync'
    private logger = this.services.logger.getNameSpace('S3_FOLDER_SYNC')
    private syncTimeout: NodeJS.Timeout | null = null
    private s3: S3
    private awsCli: Aws

    constructor (private options: S3SyncOptions, private services: Readonly<DeepstreamServices>, awsCrendentials: any) {
        super()
        this.s3 = new S3({
            ...awsCrendentials,
            region: this.options.bucketRegion
        })
        this.awsCli = new Aws({
            accessKey: awsCrendentials.accessKeyId,
            secretKey: awsCrendentials.secretAccessKey
        })
    }

    public init () {
        if (typeof this.options.syncInterval !== 'number') {
            this.logger.fatal(EVENT.ERROR, 'Invalid or missing "interval"')
        }
        if (this.options.syncInterval < 10000) {
            this.logger.fatal(EVENT.ERROR, 'interval must be above 10000')
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
            await this.s3.headBucket({
                Bucket: this.options.bucketName
            }).promise()
            this.logger.info(EVENT.INFO, `AWS S3 Bucket '${this.options.bucketName}' exists`)
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
            await this.awsCli.command(`s3 sync --region ${this.options.bucketRegion} ${this.options.syncDir} s3://${this.options.bucketName}`)
            this.logger.info(EVENT.INFO, `Synced directory ${this.options.syncDir} successfully`)
        } catch (err) {
            this.logger.error(EVENT.ERROR, 'Error syncing s3 bucket', err)
        }
    }
}