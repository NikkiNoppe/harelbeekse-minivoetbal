

## Plan: Fix Blog CRUD RLS violations

### Root cause

The `blogService` uses `withUserContext()` which sets PostgreSQL session variables via `set_current_user_context` RPC. However, Supabase uses connection pooling, so the context set in one RPC call may be lost by the time the subsequent INSERT/UPDATE/DELETE executes in a separate transaction on a different connection.

For SuperAdmin users specifically, `withUserContext` calls `supabase.rpc('set_config', ...)` **three separate times** (role, user_id, team_ids), each in its own transaction — making context loss even more likely.

### Solution

Create a database RPC function `manage_blog_post` (SECURITY DEFINER) that validates the user is admin and performs the CRUD operation atomically — same pattern as `manage_team_cost_for_match`, `update_match_with_context`, etc. This bypasses RLS entirely within a single trusted function.

### Changes

**1. Database migration: Create `manage_blog_post` RPC**

A single SECURITY DEFINER function that handles all blog CRUD:
- `create` — inserts a new blog post into `application_settings`
- `update` — updates an existing blog post by ID
- `delete` — deletes a blog post by ID
- `toggle_published` — toggles the published status

The function validates the caller is admin by checking `users.role` directly (same pattern as other admin RPCs).

**2. Update `src/services/blogService.ts`**

Replace all `withUserContext` + direct Supabase queries with calls to the new `manage_blog_post` RPC:
- `createBlogPost` → `supabase.rpc('manage_blog_post', { p_user_id, p_operation: 'create', p_setting_value: {...} })`
- `updateBlogPost` → `supabase.rpc('manage_blog_post', { p_user_id, p_operation: 'update', p_id: id, ... })`
- `deleteBlogPost` → `supabase.rpc('manage_blog_post', { p_user_id, p_operation: 'delete', p_id: id })`
- `togglePublishedStatus` → `supabase.rpc('manage_blog_post', { p_user_id, p_operation: 'toggle_published', p_id: id, p_published: boolean })`

Read operations (`getAllBlogPosts`, `getPublishedBlogPosts`) remain as direct queries since they use SELECT policies that already work.

**3. Fix BlogPage.tsx form/modal issues**

- Move the `AppModal` outside the header `div` (currently nested inside `flex justify-between` alongside the button, which can cause layout issues)
- Fix the form grid layout (title and content are in a 2-column grid but content/textarea should span full width)
- Ensure `resetForm` properly opens the dialog for new posts (currently calls `resetForm()` which closes the dialog, then immediately opens it)

### Technical details

- The RPC uses the same admin verification pattern as `delete_team_cost_as_admin`: checks `users.role = 'admin'` by `user_id`
- Returns JSONB with `success`, `message`, and optionally `id` for creates
- User ID is read from `localStorage` auth data (same as other services)
- No changes needed to RLS policies — the SECURITY DEFINER function bypasses RLS

