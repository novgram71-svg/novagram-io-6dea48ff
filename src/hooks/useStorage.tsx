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

    // Voice messages are now private - return the path for signed URL generation
    return fileName;
  };

  const uploadChatFile = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Chat files are now private - return the path for signed URL generation
    return fileName;
  };

  const uploadChatImage = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Chat images are now private - return the path for signed URL generation
    return fileName;
  };

  // Get signed URL for private files (chat files, voice messages)
  const getSignedUrl = async (bucket: string, filePath: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  };

  // Get signed URL for voice messages
  const getVoiceMessageUrl = async (filePath: string) => {
    return getSignedUrl('voice_messages', filePath);
  };

  // Get signed URL for chat files
  const getChatFileUrl = async (filePath: string) => {
    return getSignedUrl('chat-files', filePath);
  };

  return {
    uploadPostImage,
    uploadStoryImage,
    uploadAvatar,
    uploadVoiceMessage,
    uploadChatFile,
    uploadChatImage,
    getSignedUrl,
    getVoiceMessageUrl,
    getChatFileUrl,
  };
};
