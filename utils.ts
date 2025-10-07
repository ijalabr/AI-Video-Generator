export const extractFrameFromVideo = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      // Seek to the middle of the video for a representative frame
      video.currentTime = video.duration / 2;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(video.src);
      // Return base64 string without the data URL prefix
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
      resolve(base64Image);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video file for frame extraction.'));
    };
    
    // play() is required for the video to load and seek on some browsers
    video.play().catch(e => {
        // This can fail if autoplay is blocked, but seeking might still work.
        // We can ignore the error for this purpose.
    });
  });
};
