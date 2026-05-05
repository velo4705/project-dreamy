# Design Document: Reddit Clone Rebuild

## Overview

This document outlines the design for rebuilding a Reddit-like clone from scratch. The application features user authentication with JWT, post management, voting functionality, search capabilities using PostgreSQL full-text search, user profiles, and a modern React-based frontend with a Node.js backend and PostgreSQL database via Neon.

### Key Technologies

- **Frontend**: React 18 with Vite, React Router, Axios
- **Backend**: Node.js with Express
- **Database**: PostgreSQL via Neon (cloud)
- **Authentication**: JSON Web Tokens (JWT) with bcrypt password hashing
- **Search**: PostgreSQL tsvector/tsquery for full-text search
- **Deployment**: Vercel for frontend and API routes

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Deployment                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React App  │  │  API Routes  │  │   Static Assets      │  │
│  │   (dist/)    │  │  (Vercel)    │  │   (public/)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                     │
│         └─────────────────┴─────────────────────────────────────┘
│                           │
│                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL (Neon)                          │
├─────────────────────────────────────────────────────────────────┤
│  users  │  posts  │  votes  │  comments  │  search_vector (GIN)│
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

### Layered Architecture

The application follows a layered architecture pattern:

1. **Presentation Layer** (Client)
   - React components for UI
   - State management via Context API
   - API client with Axios interceptors
   - Theme and authentication context providers

2. **API Layer** (Server)
   - Express.js middleware for request handling
   - Authentication middleware (JWT verification)
   - Route handlers for all endpoints
   - Error handling middleware

3. **Business Logic Layer**
   - Request validation
   - Authorization checks
   - Business rule enforcement

4. **Data Access Layer**
   - PostgreSQL connection pooling
   - Query execution
   - Database schema management

### Component Structure

```
client/src/
├── components/
│   ├── CommentSection.jsx      # Comment display and form
│   ├── Navbar.jsx              # Navigation bar with search
│   ├── PostCard.jsx            # Post listing card
│   ├── ThemeToggle.jsx         # Theme toggle button
│   └── VoteButtons.jsx         # Upvote/downvote buttons
├── context/
│   ├── AuthContext.jsx         # Authentication state
│   └── ThemeContext.jsx        # Theme state
├── pages/
│   ├── Auth.css                # Auth page styles
│   ├── CreatePost.jsx          # Post creation page
│   ├── Home.jsx                # Home page with posts
│   ├── Login.jsx               # Login page
│   ├── PostDetail.jsx          # Single post page
│   ├── Register.jsx            # Registration page
│   ├── Search.jsx              # Search results page
│   └── UserProfile.jsx         # User profile page
└── api.js                      # Axios API client
```

## Components and Interfaces

### API Endpoints

#### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

#### Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/posts` | Create new post | Yes |
| GET | `/api/posts` | List posts (paginated, sortable) | No |
| GET | `/api/posts/search` | Search posts (full-text) | No |
| GET | `/api/posts/:id` | Get single post | No |
| PUT | `/api/posts/:id` | Edit post | Yes (author only) |
| DELETE | `/api/posts/:id` | Delete post | Yes (author only) |
| POST | `/api/posts/:id/vote` | Vote on post | Yes |

#### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/posts/:postId/comments` | Add comment | Yes |
| GET | `/api/posts/:postId/comments` | List comments | No |
| DELETE | `/api/comments/:id` | Delete comment | Yes (author only) |

### Request/Response Formats

#### Authentication

**Register Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Register Response (201):**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "created_at": "string"
  }
}
```

**Login Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Login Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "created_at": "string"
  }
}
```

#### Posts

**Create Post Request:**
```json
{
  "title": "string",
  "body": "string | null"
}
```

**Create Post Response (201):**
```json
{
  "id": "number",
  "title": "string",
  "body": "string | null",
  "author_id": "number",
  "author": "string",
  "created_at": "string",
  "updated_at": "string",
  "score": "number",
  "comment_count": "number",
  "user_vote": "number"
}
```

**List Posts Response (200):**
```json
{
  "posts": [
    {
      "id": "number",
      "title": "string",
      "body": "string | null",
      "author_id": "number",
      "author": "string",
      "created_at": "string",
      "score": "number",
      "comment_count": "number",
      "user_vote": "number"
    }
  ],
  "page": "number",
  "limit": "number",
  "total": "number",
  "totalPages": "number"
}
```

**Search Response (200):**
```json
{
  "posts": [
    {
      "id": "number",
      "title": "string",
      "author": "string",
      "created_at": "string",
      "score": "number",
      "comment_count": "number",
      "user_vote": "number",
      "rank": "number"
    }
  ],
  "query": "string",
  "page": "number",
  "limit": "number",
  "total": "number",
  "totalPages": "number"
}
```

**Vote Response (200):**
```json
{
  "post_id": "number",
  "score": "number",
  "user_vote": "number"
}
```

#### Comments

**Create Comment Request:**
```json
{
  "body": "string",
  "parent_id": "number | null"
}
```

**Create Comment Response (201):**
```json
{
  "id": "number",
  "body": "string",
  "author_id": "number",
  "author": "string",
  "post_id": "number",
  "parent_id": "number | null",
  "created_at": "string"
}
```

## Data Models

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Posts table with full-text search
CREATE TABLE posts (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    body        TEXT,
    author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    search_vector tsvector
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Trigger for search vector updates
CREATE TRIGGER trg_posts_search_vector
    BEFORE INSERT OR UPDATE OF title, body ON posts
    FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- Votes table
CREATE TABLE votes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_votes_post ON votes(post_id);

-- Comments table with nested comment support
CREATE TABLE comments (
    id              SERIAL PRIMARY KEY,
    body            TEXT NOT NULL,
    author_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

### Data Models (JavaScript)

```javascript
// User model
{
  id: number,
  username: string,
  email: string,
  created_at: string
}

// Post model
{
  id: number,
  title: string,
  body: string | null,
  author_id: number,
  author: string,
  created_at: string,
  updated_at: string,
  score: number,
  comment_count: number,
  user_vote: number
}

// Vote model
{
  id: number,
  user_id: number,
  post_id: number,
  value: -1 | 1,
  created_at: string
}

// Comment model
{
  id: number,
  body: string,
  author_id: number,
  author: string,
  post_id: number,
  parent_id: number | null,
  created_at: string,
  children: Comment[]  // For nested comments
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration creates valid user

*For any* valid registration data (unique username, unique email, password ≥ 6 characters), the system shall create a user with the provided data, hash the password using bcrypt, and return a valid JWT token.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

### Property 2: Duplicate registration fails

*For any* existing username or email, attempting to register with that credential shall fail with a 409 Conflict error and a descriptive message.

**Validates: Requirements 1.2, 1.3, 1.5**

### Property 3: Login returns valid token

*For any* valid user credentials, the system shall authenticate the user using bcrypt password verification and return a valid JWT token.

**Validates: Requirements 2.1, 2.3**

### Property 4: Invalid login fails

*For any* invalid credentials (wrong password, non-existent user), the system shall return a 401 Unauthorized error with a descriptive message.

**Validates: Requirements 2.2**

### Property 5: Logout clears session

*For any* authenticated user, calling logout shall remove the token from client storage and clear the user session.

**Validates: Requirements 3.1, 3.2**

### Property 6: Post creation validates title

*For any* post creation request, if the title is empty or exceeds 300 characters, the system shall return a 400 Bad Request error.

**Validates: Requirements 4.2**

### Property 7: Post author association

*For any* post creation request with a valid JWT, the created post shall be associated with the authenticated user as the author.

**Validates: Requirements 4.3**

### Property 8: Post edit authorization

*For any* post edit request, if the authenticated user is not the post author, the system shall return a 403 Forbidden error.

**Validates: Requirements 7.3**

### Property 9: Post deletion cascades

*For any* post deletion request, all associated votes and comments shall be automatically deleted due to ON DELETE CASCADE constraints.

**Validates: Requirements 8.4**

### Property 10: Vote toggle behavior

*For any* vote submission, if the user submits the same vote value again, the vote shall be removed (toggle off), setting the vote value to 0.

**Validates: Requirements 9.4**

### Property 11: Vote update behavior

*For any* vote submission where the user changes their vote value, the system shall update the existing vote rather than creating a duplicate.

**Validates: Requirements 9.5**

### Property 12: Search uses full-text search

*For any* search query, the system shall use PostgreSQL's tsvector/tsquery for full-text search with relevance ranking.

**Validates: Requirements 10.2**

### Property 13: Search ranking by relevance

*For any* search query, results shall be ordered by relevance rank in descending order, with more relevant posts appearing first.

**Validates: Requirements 10.3**

### Property 14: Search pagination

*For any* search request, the system shall support pagination with configurable page size (default 20, maximum 50).

**Validates: Requirements 10.5**

### Property 15: Empty search returns empty list

*For any* search query that matches no posts, the system shall return an empty list with total count of 0.

**Validates: Requirements 10.6**

### Property 16: User profile shows user posts

*For any* user profile page, the system shall retrieve and display all posts created by that user.

**Validates: Requirements 11.1**

### Property 17: Database schema constraints

*For any* database operation, the system shall enforce all defined constraints including unique constraints on username/email, CHECK constraint on vote values, and foreign key constraints with cascading deletes.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**

### Property 18: JWT token validation

*For any* authenticated request, if the JWT token is missing, invalid, or expired, the system shall return a 401 Unauthorized error.

**Validates: Requirements 13.3, 13.4**

### Property 19: Error response format

*For any* error response, the system shall include a message field explaining the error.

**Validates: Requirements 15.6**

### Property 20: Cascading user deletion

*For any* user deletion, all associated posts, votes, and comments shall be automatically deleted due to ON DELETE CASCADE constraints.

**Validates: Requirements 16.1**

### Property 21: Cascading post deletion

*For any* post deletion, all associated votes and comments shall be automatically deleted due to ON DELETE CASCADE constraints.

**Validates: Requirements 16.2**

### Property 22: Cascading comment deletion

*For any* comment deletion, all child comments shall be automatically deleted due to ON DELETE CASCADE constraints.

**Validates: Requirements 16.3**

### Property 23: Comment count updates

*For any* comment creation or deletion, the associated post's comment_count shall be incremented or decremented accordingly.

**Validates: Requirements 20.3, 20.4**

### Property 24: Nested comment structure

*For any* comment retrieval, comments shall be returned in a hierarchical structure with parent-child relationships maintained via parent_id references.

**Validates: Requirements 20.2, 20.5**

## Error Handling

### Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "string"
}
```

### HTTP Status Codes

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Bad Request | Missing required field, invalid input |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | User lacks permission for action |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate username/email |
| 500 | Internal Server Error | Unexpected server error |

### Error Handling Middleware

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
```

### Validation Errors

- Title required: `400 - "Title is required"`
- Title too long: `400 - "Title must be 300 characters or less"`
- Password too short: `400 - "Password must be at least 6 characters"`
- Empty search query: `400 - "Search query is required"`

### Authorization Errors

- Not logged in: `401 - "No token provided"` or `"Invalid or expired token"`
- Unauthorized action: `403 - "You can only edit your own posts"`
- Post not found: `404 - "Post not found"`

## Testing Strategy

### Dual Testing Approach

The testing strategy uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both are complementary and necessary for comprehensive coverage.

### Property-Based Testing Configuration

- **Library**: fast-check (JavaScript)
- **Iterations**: Minimum 100 per property test
- **Tag format**: `Feature: reddit-clone-rebuild, Property {number}: {property_text}`

### Unit Testing Focus

Unit tests should focus on:

- Specific examples that demonstrate correct behavior
- Integration points between components
- Edge cases and error conditions

### Property Testing Focus

Property tests should focus on:

- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Round-trip properties for serialization/deserialization
- Invariants that must be preserved

### Test Coverage Requirements

| Requirement | Test Type | Property |
|-------------|-----------|----------|
| Registration | Property | Property 1, 2 |
| Login | Property | Property 3, 4 |
| Logout | Property | Property 5 |
| Post creation | Property | Property 6, 7 |
| Post edit | Property | Property 8 |
| Post delete | Property | Property 9 |
| Voting | Property | Property 10, 11 |
| Search | Property | Property 12, 13, 14, 15 |
| User profile | Property | Property 16 |
| Database schema | Property | Property 17 |
| JWT validation | Property | Property 18 |
| Error responses | Property | Property 19 |
| Cascading deletes | Property | Property 20, 21, 22 |
| Comment count | Property | Property 23 |
| Nested comments | Property | Property 24 |

### Example Property Test

```javascript
// Feature: reddit-clone-rebuild, Property 1: Registration creates valid user
it('Property 1: Registration creates valid user', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 5, maxLength: 50 }),
      fc.string({ minLength: 5, maxLength: 255 }),
      fc.string({ minLength: 6, maxLength: 100 }),
      (username, email, password) => {
        // Test registration with valid data
        // Verify user is created
        // Verify password is hashed
        // Verify JWT token is returned
      }
    ),
    { numRuns: 100 }
  );
});
```

## Performance Optimization

### Database Indexes

The following indexes are defined for optimal performance:

- `idx_posts_author` on `posts(author_id)`
- `idx_posts_created` on `posts(created_at DESC)`
- `idx_posts_search` on `posts USING GIN(search_vector)`
- `idx_votes_post` on `votes(post_id)`
- `idx_comments_post` on `comments(post_id)`
- `idx_comments_parent` on `comments(parent_id)`

### Query Optimization

- Use `COUNT(*)` with `LIMIT` for pagination
- Use `LEFT JOIN` with `COALESCE` for optional aggregations
- Use `ts_rank` for search relevance ranking
- Use `ON DELETE CASCADE` for efficient cleanup

### Caching Strategy

- Client-side caching via React state
- Browser caching for static assets
- Database connection pooling for efficient queries

### Performance Targets

| Operation | Target Latency |
|-----------|----------------|
| List posts | < 500ms |
| Search posts | < 1000ms |
| Get single post | < 200ms |

## Deployment Configuration

### Vercel Configuration

```json
{
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/api/auth/register",
      "dest": "/api/auth-register"
    },
    {
      "src": "/api/auth/login",
      "dest": "/api/auth-login"
    },
    {
      "src": "/api/posts",
      "dest": "/api/posts"
    },
    {
      "src": "/api/post",
      "dest": "/api/post"
    },
    {
      "src": "/api/post-comments",
      "dest": "/api/post-comments"
    },
    {
      "src": "/api/comment",
      "dest": "/api/comment"
    },
    {
      "src": "/api/search",
      "dest": "/api/search"
    },
    {
      "src": "/api/debug",
      "dest": "/api/debug"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `NODE_ENV` | No | Environment (development/production) |

### Database Connection

```javascript
// Check if DATABASE_URL is provided (Vercel Neon integration)
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  };
} else {
  // Fallback to individual environment variables
  poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  };
}
```

## Responsive Design

### CSS Framework

Custom CSS with media queries for responsive design:

```css
/* Mobile first approach */
.container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

### Theme Support

Two themes defined with CSS variables:

```css
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  --primary-color: #ff6b6b;
  --secondary-color: #4ecdc4;
  --card-bg: #f8f9fa;
}

[data-theme="dark"] {
  --bg-color: #1a1a2e;
  --text-color: #eaeaea;
  --primary-color: #ff6b6b;
  --secondary-color: #4ecdc4;
  --card-bg: #16213e;
}
```

### Component Responsiveness

- Navbar collapses on mobile with hamburger menu
- Post cards stack vertically on mobile
- Forms adapt to touch devices with appropriate input sizes
- Search bar is prominent and accessible on all devices
