-- Allow admins to delete any posts
CREATE POLICY "Admins can delete any posts" 
ON public.posts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));