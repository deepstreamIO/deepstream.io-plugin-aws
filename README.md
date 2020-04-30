# deepstream.io-plugin-aws
A collection of AWS plugins to use with deepstream

heap-snapshot:
    name: ‘heap-snapshot’
    options:
      interval: 60000
      outputDir: file(../heap-snapshots)

  aws:
    path: ./plugins/aws/src/plugin
    options:
      accessKeyId: ${AWS_ACCESS_KEY}
      secretAccessKey: ${AWS_SECRET_ACCESS_KEY}
      services:
        - type: s3-sync
          options:
            syncInterval: 60000
            syncDir: file(../heap-snapshots)
            bucketName: controlbright-deepstream-snapshot
            bucketRegion: us-east-1