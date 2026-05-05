# Requirements Document

## Introduction

This document outlines the requirements for rebuilding a Reddit-like clone from scratch. The application will feature user authentication, post creation and management, voting functionality, search capabilities, and a modern React-based frontend with a Node.js backend and PostgreSQL database via Neon.

## Glossary

- **System**: The Reddit-like clone application
- **User**: A registered user of the system who can create posts, vote, comment, and search
- **Post**: A content item created by a user with a title, optional body, and associated metadata
- **Vote**: A user's upvote (+1) or downvote (-1) on a post
- **Comment**: A user's response to a post or another comment
- **Search**: The system's ability to find posts matching user-provided queries
- **Authentication**: The process of verifying user identity and managing sessions
- **Neon**: Cloud-based PostgreSQL database service with Vercel integration
- **Vercel**: Deployment platform for the application

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to register for an account, so that I can participate in the community.

#### Acceptance Criteria

1. WHEN a visitor submits a registration form with username, email, and password, THE System SHALL create a new user account
2. WHILE registering, THE System SHALL validate that the username is unique and not already taken
3. WHILE registering, THE System SHALL validate that the email is unique and not already taken
4. WHILE registering, THE System SHALL validate that the password meets minimum security requirements (at least 6 characters)
5. IF registration fails due to duplicate username or email, THEN THE System SHALL return a descriptive error message
6. IF registration succeeds, THEN THE System SHALL return a JSON Web Token for authentication

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in to my account, so that I can access my profile and features.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (username and password), THE System SHALL authenticate the user and return a JSON Web Token
2. WHEN a user submits invalid credentials, THEN THE System SHALL return a 401 Unauthorized error with a descriptive message
3. WHILE authenticating, THE System SHALL verify the password against the stored hash using bcrypt
4. IF authentication succeeds, THEN THE System SHALL return the user's ID, username, email, and registration timestamp

### Requirement 3: User Logout

**User Story:** As a logged-in user, I want to log out, so that I can securely end my session.

#### Acceptance Criteria

1. WHEN a user initiates logout, THE System SHALL remove the authentication token from client storage
2. WHEN logout completes, THEN THE System SHALL clear the current user session

### Requirement 4: Create Post

**User Story:** As a logged-in user, I want to create a new post, so that I can share content with the community.

#### Acceptance Criteria

1. WHEN a logged-in user submits a post creation form with a title, THE System SHALL create a new post
2. WHILE creating a post, THE System SHALL validate that the title is not empty and is 300 characters or less
3. WHILE creating a post, THE System SHALL associate the post with the authenticated user as the author
4. WHILE creating a post, THE System SHALL store the post body (if provided) and timestamps
5. IF post creation succeeds, THEN THE System SHALL return the created post with its ID, title, body, author, and timestamps

### Requirement 5: View Posts

**User Story:** As a user, I want to view a list of posts, so that I can see what content is available.

#### Acceptance Criteria

1. WHEN a user visits the home page, THE System SHALL retrieve and display posts
2. WHERE posts are displayed, THE System SHALL show the post title, author, creation time, score, and comment count
3. WHERE posts are displayed, THE System SHALL show the user's current vote status on each post
4. WHEN posts are retrieved, THE System SHALL support pagination with configurable page size (default 20, maximum 50)
5. WHEN posts are retrieved, THE System SHALL support sorting by "new" (default) or "top" (by score)

### Requirement 6: View Single Post

**User Story:** As a user, I want to view a single post in detail, so that I can read the content and see associated comments.

#### Acceptance Criteria

1. WHEN a user visits a post detail page, THE System SHALL retrieve the post by its ID
2. WHEN a post is not found, THEN THE System SHALL return a 404 Not Found error
3. WHEN a post detail is retrieved, THE System SHALL include the post content, author, timestamps, score, and comment count
4. WHEN a post detail is retrieved, THE System SHALL include the user's current vote status on the post

### Requirement 7: Edit Post

**User Story:** As the author of a post, I want to edit my post, so that I can correct mistakes or update content.

#### Acceptance Criteria

1. WHEN the author of a post submits an edit request, THE System SHALL update the post
2. WHILE editing a post, THE System SHALL validate that the title is not empty and is 300 characters or less
3. IF a non-author attempts to edit a post, THEN THE System SHALL return a 403 Forbidden error
4. IF a post does not exist, THEN THE System SHALL return a 404 Not Found error
5. IF post editing succeeds, THEN THE System SHALL return the updated post with the new timestamp

### Requirement 8: Delete Post

**User Story:** As the author of a post, I want to delete my post, so that I can remove content I no longer want to share.

#### Acceptance Criteria

1. WHEN the author of a post submits a delete request, THE System SHALL remove the post
2. IF a non-author attempts to delete a post, THEN THE System SHALL return a 403 Forbidden error
3. IF a post does not exist, THEN THE System SHALL return a 404 Not Found error
4. WHEN a post is deleted, THEN THE System SHALL also delete all associated votes and comments (cascading delete)

### Requirement 9: Upvote/Downvote Posts

**User Story:** As a logged-in user, I want to vote on posts, so that I can express my opinion on content quality.

#### Acceptance Criteria

1. WHEN a logged-in user submits an upvote (value: 1) for a post, THE System SHALL record the vote
2. WHEN a logged-in user submits a downvote (value: -1) for a post, THE System SHALL record the vote
3. WHILE recording a vote, THE System SHALL ensure each user can only vote once per post
4. IF a user submits the same vote value again, THEN THE System SHALL remove the vote (toggle off)
5. IF a user changes their vote (e.g., upvote to downvote), THEN THE System SHALL update the vote value
6. WHEN a vote is recorded, THEN THE System SHALL return the updated post score and the user's current vote status
7. IF a user attempts to vote on a non-existent post, THEN THE System SHALL return a 404 Not Found error

### Requirement 10: Search Posts

**User Story:** As a user, I want to search for posts, so that I can find specific content by keyword.

#### Acceptance Criteria

1. WHEN a user submits a search query, THE System SHALL search posts using full-text search
2. WHILE searching, THE System SHALL use PostgreSQL's tsvector/tsquery for efficient text search
3. WHILE searching, THE System SHALL rank results by relevance and return them in order
4. WHERE search results are displayed, THE System SHALL show the post title, author, creation time, score, and comment count
5. WHEN search results are retrieved, THE System SHALL support pagination with configurable page size (default 20, maximum 50)
6. IF no search results are found, THEN THE System SHALL return an empty list with total count of 0
7. IF search query is empty or missing, THEN THE System SHALL return a 400 Bad Request error

### Requirement 11: View User Profile

**User Story:** As a user, I want to view another user's profile, so that I can see their posts and activity.

#### Acceptance Criteria

1. WHEN a user visits a profile page by username, THE System SHALL retrieve all posts by that user
2. WHEN no posts are found for a user, THEN THE System SHALL return an empty list
3. WHERE user posts are displayed, THE System SHALL show the post title, author, creation time, score, and comment count
4. WHERE user posts are displayed, THE System SHALL show the user's current vote status on each post

### Requirement 12: Database Schema

**User Story:** As a developer, I want a well-structured database schema, so that the application can efficiently store and retrieve data.

#### Acceptance Criteria

1. THE System SHALL have a users table with id, username (unique), email (unique), password, and created_at fields
2. THE System SHALL have a posts table with id, title, body, author_id, created_at, and updated_at fields
3. THE System SHALL have a votes table with id, user_id, post_id, value (-1 or 1), and created_at fields, with a unique constraint on (user_id, post_id)
4. THE System SHALL have a comments table with id, body, author_id, post_id, parent_id (for nested comments), and created_at fields
5. THE posts table SHALL have a search_vector column of type tsvector for full-text search
6. THE posts table SHALL have a trigger that automatically updates search_vector on insert or update of title/body
7. THE System SHALL have appropriate indexes on foreign keys and frequently queried columns

### Requirement 13: Authentication Token

**User Story:** As a developer, I want secure authentication tokens, so that user sessions are protected.

#### Acceptance Criteria

1. WHEN a user logs in or registers, THE System SHALL generate a JSON Web Token signed with a secret key
2. THE System SHALL use bcrypt to hash passwords before storing them in the database
3. WHILE authenticating requests, THE System SHALL verify the JWT token from the Authorization header
4. IF a token is missing, invalid, or expired, THEN THE System SHALL return a 401 Unauthorized error
5. THE System SHALL store JWT_SECRET in an environment variable

### Requirement 14: Deployment Integration

**User Story:** As a developer, I want the application to deploy to Vercel, so that it can be hosted and accessed online.

#### Acceptance Criteria

1. THE System SHALL use Vercel as the deployment platform
2. THE System SHALL connect to Neon PostgreSQL database using DATABASE_URL environment variable
3. WHEN DATABASE_URL is provided, THE System SHALL use it for database connections with SSL enabled
4. WHEN DATABASE_URL is not provided, THE System SHALL fall back to individual environment variables (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME)
5. THE System SHALL configure Vercel routes to proxy API requests to the Node.js backend
6. THE System SHALL serve the React frontend from the dist directory

### Requirement 15: Error Handling

**User Story:** As a user, I want clear error messages, so that I can understand what went wrong.

#### Acceptance Criteria

1. IF a required field is missing, THEN THE System SHALL return a 400 Bad Request error with a descriptive message
2. IF authentication fails, THEN THE System SHALL return a 401 Unauthorized error
3. IF a user attempts an unauthorized action, THEN THE System SHALL return a 403 Forbidden error
4. IF a requested resource is not found, THEN THE System SHALL return a 404 Not Found error
5. IF an unexpected server error occurs, THEN THE System SHALL return a 500 Internal Server Error with minimal details
6. ALL error responses SHALL include a message field explaining the error

### Requirement 16: Data Consistency

**User Story:** As a developer, I want data integrity, so that the database remains consistent.

#### Acceptance Criteria

1. WHEN a user is deleted, THEN THE System SHALL cascade delete all their posts, votes, and comments
2. WHEN a post is deleted, THEN THE System SHALL cascade delete all associated votes and comments
3. WHEN a comment is deleted, THEN THE System SHALL cascade delete all its child comments
4. THE votes table SHALL enforce that value is either -1 or 1 using a CHECK constraint
5. THE users table SHALL enforce unique constraints on username and email
6. THE votes table SHALL enforce a unique constraint on (user_id, post_id) to prevent duplicate votes

### Requirement 17: Performance

**User Story:** As a user, I want fast response times, so that the application feels responsive.

#### Acceptance Criteria

1. WHEN retrieving a list of posts, THE System SHALL complete the request within 500ms for typical data sizes
2. WHEN searching posts, THE System SHALL complete the request within 1000ms for typical data sizes
3. WHEN retrieving a single post, THE System SHALL complete the request within 200ms
4. THE System SHALL use database indexes on frequently queried columns (author_id, created_at, search_vector)
5. THE System SHALL use database views or materialized views for complex aggregations if needed

### Requirement 18: Responsive Design

**User Story:** As a user, I want the application to work on different devices, so that I can access it from anywhere.

#### Acceptance Criteria

1. THE System SHALL use a responsive CSS framework or custom media queries
2. WHERE posts are displayed, THE System SHALL adapt layout for mobile, tablet, and desktop screens
3. WHERE forms are displayed, THE System SHALL be usable on touch devices with appropriate input sizes
4. THE System SHALL maintain consistent styling across all pages and components

### Requirement 19: Theme Support

**User Story:** As a user, I want to toggle between light and dark themes, so that I can choose my preferred appearance.

#### Acceptance Criteria

1. WHEN a user toggles the theme, THE System SHALL update the application's color scheme
2. THE System SHALL persist the user's theme preference in local storage
3. WHERE components are rendered, THE System SHALL apply theme-appropriate colors and styles
4. THE System SHALL support at least two themes: light and dark

### Requirement 20: Comment Functionality

**User Story:** As a user, I want to comment on posts, so that I can discuss content with other users.

#### Acceptance Criteria

1. WHEN a logged-in user submits a comment, THE System SHALL create a new comment associated with the post
2. WHILE creating a comment, THE System SHALL support nested comments via parent_id reference
3. WHEN a comment is created, THE System SHALL increment the post's comment count
4. WHEN a comment is deleted, THE System SHALL decrement the post's comment count
5. WHEN retrieving a post, THE System SHALL include all comments in a hierarchical structure
6. IF a user attempts to comment on a non-existent post, THEN THE System SHALL return a 404 Not Found error
