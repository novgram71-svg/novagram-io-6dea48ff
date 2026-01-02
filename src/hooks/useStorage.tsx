import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useStorage = () => {
  const { user } = useAuth();

  const uploadPostImage = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const uploadStoryImage = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('stories')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const uploadVoiceMessage = async (audioBlob: Blob) => {
    if (!user) throw new Error('Not authenticated');

    const fileName = `${user.id}/${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from('voice_messages')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('voice_messages')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return {
    uploadPostImage,
    uploadStoryImage,
    uploadAvatar,
    uploadVoiceMessage,
  };
};
