# infrastructure

Infrastructure

## Requirements

We are using [Pulumi](https://www.pulumi.com/) to Infrastructure as Code with typescript  
Install on mac:

```bash
brew install pulumi
brew install node
brew install aws-iam-authenticator
npm install --global yarn
yarn install
```

## Directory structure

On the `application` folder we have all applications deployed on the kubernetes cluster, e.g `api-skeleton`  
On the `infrastructure` folder we have all stuff for cloud-provider, kubernetes cluster, applications for infrastrucutre on cluster like, `cert-manager, datadog` etc.


### Labels

Use labels for each secret, the required fields are:

- env (e.g staging)
- application (e.g quickpay)
- squad 

## Deploy

Example to deploy change for kubernetes cluster staging

```
cd infrastructure/applications/kubernetes
pulumi up -s staging
```

## Troubleshooting

1. Error when you execute pulumi up to antifraud project
   On this project, for example to database creation this execute the command to create user [appplications/antifraud/aws/create_users.sh](appplications/antifraud/aws/create_users.sh)  
   To execute this is necessary to run locally with the VPN connected to project and required the `psql` command.
