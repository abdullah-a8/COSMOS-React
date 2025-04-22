import React, { useState, useEffect } from "react";
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "../../utils/youtube";
import { motion } from "framer-motion";

interface VideoPreviewProps {
  videoId: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Reset states when videoId changes
  useEffect(() => {
    setIsLoading(true);
    setShowVideo(false);
    setThumbnailError(false);
  }, [videoId]);

  const handleThumbnailLoad = () => {
    setIsLoading(false);
  };

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setIsLoading(false);
  };

  const handlePlayVideo = () => {
    setShowVideo(true);
  };

  const embedUrl = getYouTubeEmbedUrl(videoId);
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);

  return (
    <motion.div 
      className="relative bg-black/40 rounded-xl overflow-hidden border border-purple-700/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="aspect-video w-full">
        {!showVideo ? (
          // Thumbnail view with play button
          <div className="relative w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {thumbnailError ? (
              // Fallback when thumbnail fails to load
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                <div className="text-center">
                  <div className="text-5xl mb-2">▶️</div>
                  <div className="text-sm opacity-70">Click to play video</div>
                </div>
              </div>
            ) : (
              <motion.img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onLoad={handleThumbnailLoad}
                onError={handleThumbnailError}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoading ? 0 : 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            
            {/* Play button overlay */}
            <motion.button
              onClick={handlePlayVideo}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg group-hover:bg-purple-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-8 h-8"
                  style={{ marginLeft: "2px" }}
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </motion.div>
            </motion.button>
          </div>
        ) : (
          // Embedded YouTube player
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        )}
      </div>
      
      <div className="p-4">
        <div className="text-gray-400 text-sm">Video ID: {videoId}</div>
      </div>
    </motion.div>
  );
};

export default VideoPreview; 