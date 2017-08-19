# Zemog Master ƛ function

Zemog Master is a part of distributed two-tier system to run scheduled automated 
[Iridium](https://github.com/AutoGeneral/IridiumApplicationTesting) E2E tests at scale.

System consists of two parts:
- [master](https://github.com/AutoGeneral/zemog-master) (AWS Lambda) that schedules tests by adding tasks to AWS SQS
- [worker](https://github.com/AutoGeneral/zemog-worker) (Node.js app) that gets tasks from the queue, downloads latest test from S3 bucket
and executes them. It is also responsible for sending notifications about failing tests
and save failed results to S3 bucket

Here is the high level diagram how it works:

```
 |----------------------------|   Schedules tests using Cloudwatch Events  |-----------|
 | Zemog Master (AWS Lambda)  | -----------------------------------------> | AWS SQS   |
 |----------------------------|                                            |-----------|
                                                                                 |
                             Multiple Zemog Workers get test scedule from SQS    |
                        |--------------------------------------------------------|
                        |                           |
                        |                           |
               |-----------------|          |-----------------|
               | Zemog Worker    |          | Zemog Worker    |          ....
               |-----------------|          |-----------------|
                 |    |    |    |                  ... 
      Excecutes  |    |    |    |
      tests      |    |    |    |    Downloads archive with tests from S3    |-----------|
      using      |    |    |    |------------------------------------------  | AWS S3    |
      Iridium    |    |    |                                                 |-----------|
                 |    |    |        Saves failed tests results to S3         |-----------|
                 |    |    |---------------------------------------------->  | AWS S3    |
                 |    |                                                      |-----------|
                 |    |     Sends notifications to VictorOps/Clickatell
                 |    |---------------------------------------------------> ...
                 |     
               |-----------------|
               | Your Website    |
               |-----------------|
                
```

For Zemog Master uses [serverless](https://github.com/serverless/serverless) to automate AWS Lambda
deployments and for the sweet environment management

## Install and Configure Dependencies

1. You have to configure AWS credentials, use `awscli` or create `~/.aws/credentials` file
manually

```
sudo pip install awscli
aws configure
 AWS Access Key ID [None]: EXAMPLE
 AWS Secret Access Key [None]: EXAMPLEKEY
 Default region name [None]: ap-southeast-2
 Default output format [None]:
```

2. Install Serverless and build the app

``` 
npm i serverless -g

npm i
# or
yarn install
```

## Message Format

The format for SQS messages is simple:

```
{
    "test": "string", // test name to execute
    "app": "string", // used primary for reporting
    "location": "string", // where to find package with tests in S3
    "notifications": "array<string>" // list of notifications channels enabled for this test
}
```

For example:

```json
{
    "test": "opm-tests-1",
    "app": "opm",
    "location": "s3://zemog-bucket/website-tests.zip",
    "notifications": ["frontend"]
}
```

## Deploy

Read documentation for Serverless to learn more about deployments.
We have multiple environments here so you have to specify it

```
serverless deploy --stage sandbox
```

You will receive all kind of wierd error messages if environment configuration not found.
Like this

```
/zemog/master » serverless deploy --stage super-environment                                                                                                                                      1

  Serverless Error ---------------------------------------

     Bucket name must start with a letter or number. [object
     Object]

  Get Support --------------------------------------------
     Docs:          docs.serverless.com
     Bugs:          github.com/serverless/serverless/issues

  Your Environment Information -----------------------------
     OS:                 win32
     Node Version:       6.6.0
     Serverless Version: 1.4.0
```

## Execute

Nothing special. Local:

``` 
serverless invoke local --function master --stage sandbox
```

Remote:

```
serverless invoke --function master --stage sandbox
```

## Scheduling

Serverless provides an ability to setup execution schedule using Cloudwatch Events. 
Check `environments/sandbox.yml` for the example of scheduling

Useful documentation about scheduling:
- (Serverless scheduling)[https://serverless.com/framework/docs/providers/aws/events/schedule/#schedule]
- (AWS ScheduledEvents)[http://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html]

## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

Please submit a pull request to us with a clear list of what you've done

1. Ensure any install or build dependencies are removed before the end of the layer when doing a
   build.
2. Update the README.md with details of changes to the interface, this includes new environment
   variables, exposed ports, useful file locations and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this
   Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
5. When you send a pull request, we will love you forever if you include tests. We can always use better test coverage.
6. You may merge the Pull Request in once you have the sign-off of project's maintainers, or if you
   do not have permission to do that, you may request the reviewer to merge it for you.

## Tests

We have ESLint that will check codestyle

```
npm run-script lint
# or
yarn lint
```

### Coding conventions

Start reading our code and you'll get the hang of it.

 * We use `.editorconfig`.
 * We use `eslint` 
 * We avoid overly complex or obtuse logic, code should mostly document itself.
   Before you write a code comment think if you can make it describe itself first.
 * This is shared software. Consider the people who will read your code, and make it look nice for them.
   It's sort of like driving a car: Perhaps you love doing donuts when you're alone,
   but with passengers the goal is to make the ride as smooth as possible.
