# OpenConext-pdp
OpenConext implementation of a XACML based PDP engine for access policy enforcement

# Create database

Connect to your local mysql database: `mysql -uroot`

Execute the following:

```sql
CREATE DATABASE `pdp-server` DEFAULT CHARACTER SET latin1;
create user 'pdp-serverrw'@'localhost' identified by 'secret';
grant all on `pdp-server`.* to 'pdp-serverrw'@'localhost';
```

# Getting started
This project uses Spring Boot and Maven. To run locally, type:

`mvn spring-boot:run`

When developing, it's convenient to just execute the applications main-method, which is in [PdpApplication](src/main/java/pdp/PdpApplication).

# Local database content

We don't provide flyway migrations to load initial policies. You need to work with the GUI to define and store them. However to test locally against
a database with policies you can load the same policies used in testing with the following command

`mysql -u root pdp-server < ./src/test/resources/sql/policies.sql`

# Testing

There is an integration test for PdpApplication that tests the various decisions against a running Spring app. 

One can also use cUrl to test. Start the server and go the directory src/test/resources. Use the following command to test the permit decision:

`curl -i --user pdp_admin:secret -X POST --header "Content-Type: application/json" -d @./src/test/resources/SURFspotAccess.Permit.CategoriesShorthand.json http://localhost:8080/decide`

The directory src/test/resources contains additional test JSON inputs. To test against the test2 environment change the endpoint to `https://pdp.test2.surfconext.nl/decide`. 

Examples:

`curl -i --user pdp_admin:secret -X POST --header "Content-Type: application/json" -d @./src/test/resources/TeamAccess.Permit.json https://pdp.test2.surfconext.nl/decide`

`curl -i --user pdp_admin:secret -X POST --header "Content-Type: application/json" -d @./src/test/resources/SURFspotAccess.Deny.json https://pdp.test2.surfconext.nl/decide`

# API

We use the Spring Boot capability to expose the REST endpoint for the pdpPolicies. You can create, update and delete pdpPolicies using the standard 
[Spring Boot rest API](https://spring.io/guides/gs/accessing-data-rest/).

`curl -i --user pdp_admin:secret -X POST -H "Content-Type:application/json" -d '{  "policyXml" : "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" }' http://localhost:8080/api/pdpPolicies`

`curl -i --user pdp_admin:secret -X PATCH -H "Content-Type:application/json" -d '{"policyXml" : "wtf" }' http://localhost:8080/api/pdpPolicies/8`

# Configuration and Deployment

On its classpath, the application has an [application.properties](src/main/resources/application.properties) file that
contains configuration defaults that are convenient when developing.

When the application actually gets deployed to a meaningful platform, it is pre-provisioned with ansible and the application.properties depends on
environment specific properties in the group_vars. See the project OpenConext-deploy and the role pdp for more information.

For details, see the [Spring Boot manual](http://docs.spring.io/spring-boot/docs/1.2.1.RELEASE/reference/htmlsingle/).

