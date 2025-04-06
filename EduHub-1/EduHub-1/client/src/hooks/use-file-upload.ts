import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const uploadFile = async (file: File, path: string): Promise<string> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create a unique filename to avoid collisions
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const fullPath = `${path}/${fileName}`;
      
      // Create reference to the file location in Firebase Storage
      const storageRef = ref(storage, fullPath);
      
      // Upload the file
      const uploadTask = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      setProgress(100);
      return downloadURL;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during upload'));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    uploadFile,
    isUploading,
    progress,
    error,
  };
}
