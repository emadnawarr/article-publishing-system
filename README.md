# article-publishing-system
This repository contains the backend implementation for an article publishing platform similar to Medium. It provides API endpoints for user management, article publishing, tag following, and article feeds. This README file outlines how to set up and run the backend, important decisions made during implementation, and instructions for testing the APIs using Postman.

## Prerequisites
Before running the backend, ensure you have the following installed:

1) Node.js (v14.x or higher)

2) MySQL or MariaDB

## Features

### Authentication

Sign Up and Sign In for users.

### Article Management
-Publish articles with title, summary, body, and tags.

-Track number of viewers and likes for each article.

-Follow tags and Publishers

### Article Feed

Display recent articles based on followed tags and publishers for each user.

### Tag Analytics

Display UI widget with highest visited tags.


## How to run:

 Set up environment variables accordingly:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=bloggingsystem

Initialize the database using the schema in the servers folder (database.txt)

Start the server using node index.js

## API Documentation
### Authentication

POST /signup: Register a new user.

POST /login: Authenticate user login.

### Article Management

POST /publish: Publish a new article.

PUT /likeArticle: Increment likes for an article.

GET /viewFullArticle: Retrieve full details of an article.

### Tag and Publisher Following

POST /followTag: Follow a tag.

POST /followPublisher: Follow a publisher.

### Article Feed

GET /displayFeed: Retrieve articles based on user's followed tags and publishers.

GET /getNamesOfHighestVisitedTags: Retrieve highest visited tags.

## Postman Collection
The postman folder contains a Postman collection that includes API requests to test all endpoints. Import this collection into Postman for testing and development.

## Technologies Used

Node.js: JavaScript runtime environment.

Express: Web framework for Node.js.

MySQL: Relational database management system.
