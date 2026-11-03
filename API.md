# Campus Connect API

Base URL (local): `http://localhost:5000`

Protected routes need the header `Authorization: Bearer <token>`. Get the token from `POST /api/auth/login`.

Roles: Student, Authority, Admin. "Staff" = Authority or Admin. The server reads the role from the database on every protected request, so role changes apply immediately.

## Auth

| Method | URL                             | Access                | Purpose                                                                                                                      |
| ------ | ------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | /api/auth/signup                | Public                | Register. Body: `email` (must end in `@medicaps.ac.in`), `password` (min 6), `username`                                      |
| GET    | /api/auth/verify/:token         | Public                | Verify email from the emailed link                                                                                           |
| POST   | /api/auth/resend-verification   | Public                | Send a new verification link to an unverified account. Body: `email`. Same reply in every case, 60-second cooldown           |
| POST   | /api/auth/login                 | Public                | Log in. Body: `email`, `password`. Returns a JWT                                                                             |
| PUT    | /api/auth/backup-email          | Logged-in             | Add a backup email. Body: `backupEmail`. Sends a verification link to it                                                     |
| GET    | /api/auth/verify-backup/:token  | Public                | Confirm the backup email from the emailed link                                                                               |
| POST   | /api/auth/forgot-password       | Public                | Email a reset link (1 hour). Body: `email` (college email or verified backup email). Same reply in every case                |
| POST   | /api/auth/reset-password/:token | Public                | Set a new password. Body: `password` (min 6). Link works once                                                                |
| DELETE | /api/auth/account               | Logged-in (not Admin) | Delete own account. Body: `password`. Posts and comments stay as "Deleted user". Same email can't sign up again for 24 hours |
| GET | /api/auth/me | Logged-in | Own profile: email, username, role, backup email status |
| PUT | /api/auth/password | Logged-in | Change password. Body: `currentPassword`, `newPassword` (min 6) |
## FAQs

| Method | URL                    | Access                                    | Purpose                                                                                           |
| ------ | ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | /api/faqs              | Public                                    | List all FAQs, newest first                                                                       |
| GET    | /api/faqs?q=bus refund | Public                                    | Atlas Search over title and description (typo tolerant, title boosted). Each result has a `score` |
| POST   | /api/faqs              | Staff                                     | Create FAQ. Body: `title`, `description`; optional files (see Uploads)                            |
| PUT    | /api/faqs/:id          | Admin, or the staff member who created it | Update (partial). Body: `title` and/or `description`                                              |
| DELETE | /api/faqs/:id          | Admin, or the staff member who created it | Delete FAQ                                                                                        |

## Announcements

| Method | URL                    | Access                                    | Purpose                                                                    |
| ------ | ---------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| GET    | /api/announcements     | Public                                    | List all announcements, newest first                                       |
| POST   | /api/announcements     | Staff                                     | Create. Body: `title`, `content`, `category`; optional files (see Uploads) |
| PUT    | /api/announcements/:id | Admin, or the staff member who created it | Update (partial)                                                           |
| DELETE | /api/announcements/:id | Admin, or the staff member who created it | Delete                                                                     |

## Posts (Discussion Board)

| Method | URL                   | Access         | Purpose                                                                                                                      |
| ------ | --------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | /api/posts            | Public         | List posts. Optional `q` (Atlas Search over title and content) and `sort` = `new`, `old`, `top` or `relevance`               |
| GET    | /api/posts/:id        | Public         | One post                                                                                                                     |
| POST   | /api/posts            | Logged-in      | Create post. Body: `title`, `content`, `flair` (Academic Doubt / Placement Experience / General Query); optional image files |
| PUT    | /api/posts/:id/upvote | Logged-in      | Toggle upvote                                                                                                                |
| DELETE | /api/posts/:id        | Owner or Admin | Delete post, with its comments and their notifications                                                                       |

## Comments

| Method | URL                                        | Access         | Purpose                                                                                            |
| ------ | ------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------- |
| GET    | /api/comments/post/:postId?page=1&limit=10 | Public         | Top-level comments of a post, newest first, paginated, with `replyCount`                           |
| GET    | /api/comments/:id/replies?page=1&limit=5   | Public         | Replies of one top-level comment, oldest first, paginated                                          |
| POST   | /api/comments                              | Logged-in      | Create comment or reply. Body: `postId`, `content`; for a reply also `parentComment`, `taggedUser` |
| PUT    | /api/comments/:id/upvote                   | Logged-in      | Toggle upvote                                                                                      |
| DELETE | /api/comments/:id                          | Owner or Admin | Delete (a top-level comment also deletes its replies)                                              |

## Notifications

| Method | URL                                | Access    | Purpose                                             |
| ------ | ---------------------------------- | --------- | --------------------------------------------------- |
| GET    | /api/notifications?page=1&limit=20 | Logged-in | Own notifications, newest first, with `unreadCount` |
| PUT    | /api/notifications/read-all        | Logged-in | Mark all as read                                    |
| PUT    | /api/notifications/:id/read        | Logged-in | Mark one as read                                    |
| DELETE | /api/notifications                 | Logged-in | Clear all                                           |
| DELETE | /api/notifications/:id             | Logged-in | Dismiss one                                         |

## My Activity

| Method | URL                                      | Access    | Purpose                                                                              |
| ------ | ---------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| GET    | /api/activity?type=posts&page=1&limit=10 | Logged-in | Own posts (`type=posts`) or own comments and replies (`type=comments`), newest first |

## Real-time (Socket.io)

Connect to the base URL with `io(baseUrl, { auth: { token } })`. The server verifies the token and puts the user in a private room. It then pushes an event named `notification` for each new notification, in the same shape as `GET /api/notifications`. Offline users find their notifications stored in the database.

## Uploads

Send `multipart/form-data` with the files in a field named `files`. Plain JSON requests still work and give `attachments: []`.

| Where               | Allowed files       | Max count | Max size  |
| ------------------- | ------------------- | --------- | --------- |
| Posts               | JPG, PNG, WEBP, GIF | 4         | 2 MB each |
| Announcements, FAQs | Images and PDF      | 5         | 2 MB each |

Files go to Cloudinary, and only the returned URLs are stored in `attachments`. The file's first bytes are checked, so a renamed file is rejected.

## Rules enforced on the server

- Replies can only attach to top-level comments (single-level nesting).
- Maximum 200 replies per top-level comment.
- Profanity is rejected on usernames, posts and comments.
- Notifications: a comment on your post notifies you, a reply notifies the comment's author, an @tag notifies the tagged user. You never notify yourself, and one comment gives one notification per person.
- Admin accounts can't be deleted through the API.

## Admin

| Method | URL | Access | Purpose |
|---|---|---|---|
| GET | /api/admin/users?page=1&limit=20&q=&role= | Admin | List users with optional search (username or email) and role filter |
| PUT | /api/admin/users/:id/role | Admin | Change a user's role. Body: `role` (student / authority / admin). Can't change your own role |