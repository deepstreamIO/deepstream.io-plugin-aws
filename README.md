# deepstream.io-plugin-aws
A collection of AWS plugins to use with deepstream

```
plugins:
  aws:
    name: aws
    options:
      accessKeyId: ${AWS_ACCESS_KEY}
      secretAccessKey: ${AWS_SECRET_ACCESS_KEY}
      services:
        - type: s3-sync
          options:
            syncInterval: 60000
            syncDir: file(../heap-snapshots)
            bucketName: ${SYNC_BUCKET_NAME}
            bucketRegion: ${AWS_DEFAULT_REGION}
```