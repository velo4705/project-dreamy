# Implementation Plan: Reddit Clone Rebuild

## Overview

This implementation plan covers rebuilding a Reddit-like clone with user authentication, post management, voting, search, and comments. The project uses React frontend, Node.js backend, and PostgreSQL via Neon with Vercel deployment.

## Tasks

- [x] 1. Set up project structure and dependencies
  - [x] 1.1 Install and configure backend dependencies
    - Install Express, bcrypt, jsonwebtoken, pg, cors, dotenv
    - Configure package.json scripts for development
    - _Requirements: 12.1, 13.1, 14.1_
  
  - [x] 1.2 Install and configure frontend dependencies
    - Install React, Vite, React Router, Axios, fast-check (for testing)
    - Configure Vite and React settings
    - _Requirements: 14.1, 18.1_

- [x] 2. Set up database schema and migrations
  - [x] 2.1 Create users table
    - Define id, username (unique), email (unique), password, created_at
    - _Requirements: 12.1_
  
  - [x] 2.2 Create posts table with full-text search
    - Define id, title, body, author_id, created_at, updated_at, search_vector
    - Create GIN index on search_vector
    - _Requirements: 12.2, 12.5, 12.7_
  
  - [x] 2.3 Create votes table
    - Define id, user_id, post_id, value (-1 or 1), created_at
    - Add unique constraint on (user_id, post_id)
    - Add CHECK constraint on value
    - _Requirements: 12.3, 16.4, 16.5_
  
  - [x] 2.4 Create comments table with nested support
    - Define id, body, author_id, post_id, parent_id, created_at
    - Add foreign key constraints with ON DELETE CASCADE
    - _Requirements: 12.4, 16.3_
  
  - [x] 2.5 Create search vector trigger
    - Create trigger function for automatic search_vector updates
    - Create trigger on posts table
    - _Requirements: 12.6_

- [x] 3. Implement database connection and configuration
  - [x] 3.1 Create database pool configuration
    - Configure connection using DATABASE_URL or fallback environment variables
    - Enable SSL for production (Neon integration)
    - _Requirements: 14.2, 14.3, 14.4_
  
  - [x] 3.2 Test database connection
    - Verify connection to Neon PostgreSQL
    - _Requirements: 14.1_

- [x] 4. Implement authentication system
  - [x] 4.1 Create password hashing utility
    - Implement bcrypt password hashing
    - Implement password verification
    - _Requirements: 13.2_
  
  - [x] 4.2 Implement JWT token generation and verification
    - Create JWT signing with secret from environment
    - Create middleware for token verification
    - _Requirements: 13.1, 13.3_
  
  - [x] 4.3 Create registration endpoint
    - Validate username uniqueness
    - Validate email uniqueness
    - Validate password length (≥ 6 characters)
    - Return JWT token on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
  
  - [x] 4.4 Create login endpoint
    - Verify password with bcrypt
    - Return JWT token and user data
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x] 4.5 Create logout endpoint
    - Clear token from client storage
    - Clear user session
    - _Requirements: 3.1, 3.2_
  
  - [x] 4.6 Create auth middleware
    - Verify JWT token from Authorization header
    - Attach user to request object
    - Return 401 for invalid/missing tokens
    - _Requirements: 13.3, 13.4_

- [x] 5. Implement post management
  - [x] 5.1 Create post creation endpoint
    - Validate title (required, ≤ 300 characters)
    - Associate post with authenticated user
    - Return created post with all fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.2 Create post listing endpoint
    - Support pagination (default 20, max 50)
    - Support sorting by "new" or "top"
    - Include user's vote status
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.3 Create post detail endpoint
    - Retrieve post by ID
    - Include author, timestamps, score, comment count
    - Include user's vote status
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 5.4 Create post edit endpoint
    - Validate title (required, ≤ 300 characters)
    - Check authorization (only author can edit)
    - Update updated_at timestamp
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 5.5 Create post delete endpoint
    - Check authorization (only author can delete)
    - Cascade delete votes and comments
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 6. Implement voting functionality
  - [x] 6.1 Create vote endpoint
    - Accept upvote (1) or downvote (-1)
    - Implement toggle behavior (same value removes vote)
    - Update vote if user changes vote value
    - Return updated score and user vote status
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 6.2 Update post score calculation
    - Calculate score as sum of all vote values
    - Include in post queries
    - _Requirements: 9.6_

- [x] 7. Implement search functionality
  - [x] 7.1 Create search endpoint
    - Use PostgreSQL tsvector/tsquery for full-text search
    - Rank results by relevance using ts_rank
    - Support pagination (default 20, max 50)
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  
  - [x] 7.2 Implement search validation
    - Return 400 for empty or missing search query
    - _Requirements: 10.7_

- [x] 8. Implement comment functionality
  - [x] 8.1 Create comment creation endpoint
    - Support nested comments via parent_id
    - Increment post's comment_count
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [x] 8.2 Create comment listing endpoint
    - Retrieve all comments for a post
    - Return hierarchical structure
    - _Requirements: 20.5_
  
  - [x] 8.3 Create comment deletion endpoint
    - Check authorization (only author can delete)
    - Cascade delete child comments
    - Decrement post's comment_count
    - _Requirements: 20.4, 20.5, 20.6_

- [x] 9. Implement user profile functionality
  - [x] 9.1 Create user profile endpoint
    - Retrieve all posts by a specific user
    - Include vote status for each post
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 10. Implement error handling
  - [x] 10.1 Create error response middleware
    - Standard error format with message field
    - 400 for validation errors
    - 401 for authentication errors
    - 403 for authorization errors
    - 404 for not found errors
    - 500 for internal server errors
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [x] 11. Implement data consistency
  - [x] 11.1 Configure cascading deletes
    - User deletion cascades to posts, votes, comments
    - Post deletion cascades to votes, comments
    - Comment deletion cascades to child comments
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 12. Implement frontend components
  - [x] 12.1 Create authentication pages
    - Register page with form validation
    - Login page with form validation
    - Auth context integration
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [x] 12.2 Create post creation page
    - Title and body input fields
    - Form validation
    - Auth context integration
    - _Requirements: 4.1_
  
  - [x] 12.3 Create home page with post list
    - PostCard component for each post
    - Pagination controls
    - Sort options (new/top)
    - Auth context integration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 12.4 Create post detail page
    - Post content display
    - VoteButtons component
    - CommentSection component
    - Auth context integration
    - _Requirements: 6.1, 20.1_
  
  - [x] 12.5 Create search page
    - Search input with debounce
    - Search results display
    - Pagination controls
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_
  
  - [x] 12.6 Create user profile page
    - User posts display
    - Auth context integration
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 13. Implement context providers
  - [x] 13.1 Create AuthContext
    - Login/logout functionality
    - Token storage management
    - User state management
    - _Requirements: 1.6, 2.1, 3.1_
  
  - [x] 13.2 Create ThemeContext
    - Light/dark theme toggle
    - Local storage persistence
    - Theme application to components
    - _Requirements: 19.1, 19.2, 19.3_

- [x] 14. Implement API client
  - [x] 14.1 Create Axios instance
    - Base URL configuration
    - Request/response interceptors
    - Token injection
    - _Requirements: 13.3_

- [x] 15. Implement responsive design
  - [x] 15.1 Create responsive CSS
    - Mobile-first approach
    - Media queries for tablet and desktop
    - Responsive post cards and forms
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 16. Implement theme support
  - [x] 16.1 Create theme toggle component
    - Theme toggle button
    - Local storage persistence
    - _Requirements: 19.1, 19.2_
  
  - [x] 16.2 Apply theme to components
    - CSS variables for colors
    - Dark theme styles
    - _Requirements: 19.3, 19.4_

- [x] 17. Set up testing infrastructure
  - [x] 17.1 Install testing dependencies
    - fast-check for property-based testing
    - Jest/Vitest for unit testing
    - _Requirements: Testing Strategy_
  
  - [x] 17.2 Configure test environment
    - Set up test database or mock
    - Configure test scripts
    - _Requirements: Testing Strategy_

- [x] 18. Write property-based tests
  - [x] 18.1 Property 1: Registration creates valid user
    - Test registration with valid data
    - Verify user creation and password hashing
    - Verify JWT token return
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**
  
  - [x] 18.2 Property 2: Duplicate registration fails
    - Test registration with existing username/email
    - Verify 409 Conflict error
    - **Validates: Requirements 1.2, 1.3, 1.5**
  
  - [x] 18.3 Property 3: Login returns valid token
    - Test login with valid credentials
    - Verify JWT token return
    - **Validates: Requirements 2.1, 2.3**
  
  - [x] 18.4 Property 4: Invalid login fails
    - Test login with invalid credentials
    - Verify 401 Unauthorized error
    - **Validates: Requirements 2.2**
  
  - [x] 18.5 Property 5: Logout clears session
    - Test logout functionality
    - Verify token removal and session clear
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 18.6 Property 6: Post creation validates title
    - Test post creation with invalid titles
    - Verify 400 Bad Request error
    - **Validates: Requirements 4.2**
  
  - [x] 18.7 Property 7: Post author association
    - Test post creation with valid JWT
    - Verify post author association
    - **Validates: Requirements 4.3**
  
  - [x] 18.8 Property 8: Post edit authorization
    - Test post edit by non-author
    - Verify 403 Forbidden error
    - **Validates: Requirements 7.3**
  
  - [x] 18.9 Property 9: Post deletion cascades
    - Test post deletion
    - Verify votes and comments are deleted
    - **Validates: Requirements 8.4**
  
  - [x] 18.10 Property 10: Vote toggle behavior
    - Test same vote submission
    - Verify vote removal (toggle off)
    - **Validates: Requirements 9.4**
  
  - [x] 18.11 Property 11: Vote update behavior
    - Test vote value change
    - Verify vote update without duplicate
    - **Validates: Requirements 9.5**
  
  - [x] 18.12 Property 12: Search uses full-text search
    - Test search query execution
    - Verify tsvector/tsquery usage
    - **Validates: Requirements 10.2**
  
  - [x] 18.13 Property 13: Search ranking by relevance
    - Test search results ordering
    - Verify relevance rank ordering
    - **Validates: Requirements 10.3**
  
  - [x] 18.14 Property 14: Search pagination
    - Test search with pagination
    - Verify configurable page size
    - **Validates: Requirements 10.5**
  
  - [x] 18.15 Property 15: Empty search returns empty list
    - Test search with no matches
    - Verify empty list with total 0
    - **Validates: Requirements 10.6**
  
  - [x] 18.16 Property 16: User profile shows user posts
    - Test user profile retrieval
    - Verify all user posts returned
    - **Validates: Requirements 11.1**
  
  - [x] 18.17 Property 17: Database schema constraints
    - Test constraint enforcement
    - Verify unique, CHECK, and foreign key constraints
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**
  
  - [x] 18.18 Property 18: JWT token validation
    - Test missing/invalid/expired tokens
    - Verify 401 Unauthorized error
    - **Validates: Requirements 13.3, 13.4**
  
  - [x] 18.19 Property 19: Error response format
    - Test error responses
    - Verify message field in all errors
    - **Validates: Requirements 15.6**
  
  - [x] 18.20 Property 20: Cascading user deletion
    - Test user deletion
    - Verify posts, votes, comments deleted
    - **Validates: Requirements 16.1**
  
  - [x] 18.21 Property 21: Cascading post deletion
    - Test post deletion
    - Verify votes and comments deleted
    - **Validates: Requirements 16.2**
  
  - [x] 18.22 Property 22: Cascading comment deletion
    - Test comment deletion
    - Verify child comments deleted
    - **Validates: Requirements 16.3**
  
  - [x] 18.23 Property 23: Comment count updates
    - Test comment creation/deletion
    - Verify comment_count increment/decrement
    - **Validates: Requirements 20.3, 20.4**
  
  - [x] 18.24 Property 24: Nested comment structure
    - Test comment retrieval
    - Verify hierarchical structure
    - **Validates: Requirements 20.2, 20.5**

- [x] 19. Write unit tests
  - [x] 19.1 Write unit tests for authentication
    - Test password hashing and verification
    - Test JWT token generation and verification
    - _Requirements: 13.1, 13.2_
  
  - [x] 19.2 Write unit tests for post operations
    - Test post creation, retrieval, update, delete
    - Test authorization checks
    - _Requirements: 4.1, 5.1, 7.1, 8.1_
  
  - [x] 19.3 Write unit tests for voting
    - Test vote creation, update, removal
    - Test score calculation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [x] 19.4 Write unit tests for search
    - Test search query execution
    - Test relevance ranking
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 19.5 Write unit tests for comments
    - Test comment creation, retrieval, deletion
    - Test nested comment structure
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [x] 20. Configure deployment
  - [x] 20.1 Set up Vercel configuration
    - Configure output directory
    - Set up API route routing
    - _Requirements: 14.5_
  
  - [x] 20.2 Configure environment variables
    - Set DATABASE_URL for Neon
    - Set JWT_SECRET
    - _Requirements: 14.2, 14.3_
  
  - [x] 20.3 Deploy to Vercel
    - Deploy frontend and API routes
    - Verify Neon database connection
    - _Requirements: 14.1, 14.2_

- [x] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a layered architecture: frontend (React), API layer (Express), business logic, and data access (PostgreSQL)
- All API endpoints include proper authentication, authorization, and error handling
- Database schema includes proper constraints and indexes for data integrity and performance
- Search functionality uses PostgreSQL's full-text search with relevance ranking
- Comment system supports nested comments with hierarchical structure
- Theme support includes light/dark mode with local storage persistence
- Responsive design ensures application works on mobile, tablet, and desktop
