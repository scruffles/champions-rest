# to create CF service for velocity-home (NP)
# cf cups velocity-home -p '{"alias":"velocity-home","value":"velocity-np.ag"}'

module.exports = (cfDeploy) ->
    deployable: '.'
    deployer: cfDeploy.deployers.awsDeployment
    domain: if cfDeploy.args.smokeTest isnt 'prod' then 'mcf-np.local'
    diskLimit: "256M"
    instances: 2
    memoryLimit: "256M"
    route: 'tom-allen'
    services: [
        'velocity-home'
    ]
    smokeTest: "nonProd"
    startupCommand: 'npm start'
    buildpack: "nodejs_v6_9_5_buildpack"