# Campus Connect API

Base URL (local): `http://localhost:5000`

Protected routes need the header `Authorization: Bearer <token>`. Get the token from `POST /api/auth/login`.

Roles: Student, Authority, Admin. "Staff" = Authority or Admin.

## Auth

| Method | URL | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/signup | Public | Register with a college email. Body: `email`, `password`, `username` |
| GET | /api/auth/verify/:token | Public | Verify email from the emailed link |
| POST | /api/auth/login | Public | Log in. Body: `email`, `password`. Returns a JWT |

## FAQs

| Method | URL | Access | Purpose |
|---|---|---|---|
| GET | /api/faqs | Public | List all FAQs |
| POST | /api/faqs | Staff | Create FAQ. Body: `title`, `description` |
| PUT | /api/faqs/:id | Staff | Update FAQ (partial). Body: `title` and/or `description` |
| DELETE | /api/faqs/:id | Staff | Delete FAQ |

## Announcements

| Method | URL | Access | Purpose |
|---|---|---|---|
| GET | /api/announcements | Public | List all announcements |
| POST | /api/announcements | Staff | Create. Body: `title`, `content`, `category` |
| PUT | /api/announcements/:id | Staff | Update (partial) |
| DELETE | /api/announcements/:id | Staff | Delete |

## Posts (Discussion Board)

| Method | URL | Access | Purpose |
|---|---|---|---|
| GET | /api/posts | Public | List all posts |
| POST | /api/posts | Logged-in | Create post. Body: `title`, `content`, `flair` (Academic Doubt / Placement Experience / General Query) |
| PUT | /api/posts/:id/upvote | Logged-in | Toggle upvote |
| DELETE | /api/posts/:id | Owner or Admin | Delete post |

## Comments

| Method | URL | Access | Purpose |
|---|---|---|---|
| GET | /api/comments/post/:postId?page=1&limit=10 | Public | Top-level comments of a post, paginated |
| GET | /api/comments/:id/replies?page=1&limit=5 | Public | Replies of one top-level comment, paginated |
| POST | /api/comments | Logged-in | Create comment or reply. Body: `postId`, `content`; for a reply also `parentComment`, `taggedUser` |
| PUT | /api/comments/:id/upvote | Logged-in | Toggle upvote |
| DELETE | /api/comments/:id | Owner or Admin | Delete (a top-level comment also deletes its replies) |

## Rules enforced in the controller

- Replies can only attach to top-level comments (single-level nesting).
- Maximum 200 replies per top-level comment.