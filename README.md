# Introduction
**etdrivingschool-api** is used to provision AWS API Gateway and related AWS Lambda functions to support the etdrivingschool-web project.

# Installation
Clone the repository
```bash
git clone https://github.com/codeaim/etdrivingschool-api.git
```

Navigate into the project directory
```bash
cd etdrivingschool-api
```

Install dependenices
```bash
npm install
```

Create deployment package
```bash
zip -r deploy.zip index.js node_modules
```

Create AWS S3 bucket
```bash
aws s3api create-bucket --bucket etdrivingschool-api
```

Upload deployment package to AWS S3 bucket
```bash
aws s3 cp deploy.zip s3://etdrivingschool-api/deploy.zip
```

Upload AWS API Gateway OpenAPI specification to AWS S3 bucket
```bash
aws s3 cp swagger.yml s3://etdrivingschool-api/swagger.yml
```

Upload AWS CloudFormation template to AWS S3 bucket
```bash
aws s3 cp template.yml s3://etdrivingschool-api/template.yml
```

Create etdrivingschool-api stack using AWS CloudFormation template. Replace parameter values with valid values.
```bash
aws cloudformation create-stack --stack-name etdrivingschool-api --template-url https://s3.amazonaws.com/etdrivingschool-api/template.yml --capabilities CAPABILITY_IAM --parameters ParameterKey=MailgunApiKeyParameter,ParameterValue=MailgunApiKeyParameter ParameterKey=MailgunDomainParameter,ParameterValue=MailgunDomainParameter ParameterKey=TwitterConsumerKeyParameter,ParameterValue=TwitterConsumerKeyParameter ParameterKey=TwitterConsumerSecretParameter,ParameterValue=TwitterConsumerSecretParameter ParameterKey=TwitterAccessTokenKeyParameter,ParameterValue=TwitterAccessTokenKeyParameter ParameterKey=TwitterAccessTokenSecretParameter,ParameterValue=TwitterAccessTokenSecretParameter
```

View details of provisioned AWS API Gateway
```bash
aws apigateway get-rest-apis
```
