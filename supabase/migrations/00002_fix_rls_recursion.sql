-- migration: 00002_fix_rls_recursion
-- purpose: fix infinite recursion in RLS policies on users/workspaces/channels
--
-- The users SELECT policy references public.users to look up workspace_id,
-- which triggers the same policy again → infinite recursion.
-- Fix: use a SECURITY DEFINER function that bypasses RLS for the inner lookup.

-- Helper function: returns workspace_ids the current auth user belongs to
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id
  FROM public.users
  WHERE auth_user_id = (SELECT auth.uid());
$$;

-- Drop old policies
DROP POLICY IF EXISTS "users can view users in own workspace" ON public.users;
DROP POLICY IF EXISTS "users can view own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "users can view channels in own workspace" ON public.channels;
DROP POLICY IF EXISTS "users can view messages in own workspace" ON public.messages;
DROP POLICY IF EXISTS "users can view urls in own workspace" ON public.urls;
DROP POLICY IF EXISTS "users can view tags in own workspace" ON public.tags;

-- Recreate policies using the helper function (no recursion)
CREATE POLICY "users can view users in own workspace"
  ON public.users FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "users can view own workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "users can view channels in own workspace"
  ON public.channels FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "users can view messages in own workspace"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = messages.channel_id
        AND c.workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );

CREATE POLICY "users can view urls in own workspace"
  ON public.urls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channels c ON c.id = m.channel_id
      WHERE m.id = urls.message_id
        AND c.workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );

CREATE POLICY "users can view tags in own workspace"
  ON public.tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.channels c ON c.id = m.channel_id
      WHERE m.id = tags.message_id
        AND c.workspace_id IN (SELECT public.get_my_workspace_ids())
    )
  );
