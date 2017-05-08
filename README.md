# Introduction
**urlcheck-api** is used to provision AWS API Gateway and related AWS Lambda functions to support the urlcheck-web project.

# Installation
Clone the repository
```bash
git clone https://github.com/codeaim/urlcheck-api.git
```

Navigate into the project directory
```bash
cd urlcheck-api
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
aws s3api create-bucket --bucket urlcheck-api --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1
```

Upload deployment package to AWS S3 bucket
```bash
aws s3 cp deploy.zip s3://urlcheck-api/deploy.zip
```

Upload AWS API Gateway OpenAPI specification to AWS S3 bucket
```bash
aws s3 cp swagger.yml s3://urlcheck-api/swagger.yml
```

Upload AWS CloudFormation template to AWS S3 bucket
```bash
aws s3 cp template.yml s3://urlcheck-api/template.yml
```

Create etdrivingschool-api stack using AWS CloudFormation template. Replace parameter values with valid values.
```bash
aws cloudformation create-stack --stack-name urlcheck-api --template-url https://s3.amazonaws.com/urlcheck-api/template.yml --capabilities CAPABILITY_IAM --parameters ParameterKey=DatabaseUrlParameter,ParameterValue=DatabaseUrlParameter
```

View details of provisioned AWS API Gateway
```bash
aws apigateway get-rest-apis
```
