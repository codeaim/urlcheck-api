# Introduction
**urlcheck** is a url monitoring service.
**urlcheck-api** is used to provision AWS API Gateway and related AWS Lambda functions to support the urlcheck-web and urlcheck-probe projects.

# Prerequisites
- Node v6.4.x with npm (https://nodejs.org/)
- AWS Command Line Interface (https://aws.amazon.com/cli/)
- AWS access credentials (http://docs.aws.amazon.com/cli/latest/reference/configure/)

# Installation
Apply AWS access credentials
```bash
aws configure
```

Clone the repository
```bash
git clone https://github.com/codeaim/urlcheck-api.git
```

Navigate into the project directory
```bash
cd urlcheck-api
```
Create AWS S3 bucket
```bash
aws s3api create-bucket --bucket urlcheck-api --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1
```

Install dependencies
```bash
npm install
```

Set deployment configuration
```bash
npm config set urlcheck-api:database_url=database_url
```


Produce deployment package. Upload deployment package, AWS API Gateway OpenAPI specification & AWS CloudFormation template to AWS S3 bucket. Create AWS CloudFormation stack.
```bash
npm start
```
