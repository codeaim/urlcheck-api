# Introduction
**urlcheck** is a url monitoring service.
**urlcheck-api** is used to provision AWS API Gateway and related AWS Lambda functions to support the urlcheck-web and urlcheck-probe projects.

# Prerequisites
- Node v6.4.x with npm (https://nodejs.org/)
- AWS Command Line Interface (https://aws.amazon.com/cli/)
- AWS access credentials (http://docs.aws.amazon.com/cli/latest/reference/configure/)

# Setup
Apply AWS access credentials
```bash
aws configure
```

Create AWS S3 bucket
```bash
npm run setup
```

# Getting started
Clone the repository
```bash
git clone https://github.com/codeaim/urlcheck-api.git
```

Navigate into the project directory
```bash
cd urlcheck-api
```

Install dependencies
```bash
npm install
```

Set deployment configuration with valid values
```bash
npm config set urlcheck-api:database_url=<database_url>
```

Produce deployment package. Upload deployment package, AWS API Gateway OpenAPI specification & AWS CloudFormation template to AWS S3 bucket. Create AWS CloudFormation stack and wait for completion.
```bash
npm run create
```
