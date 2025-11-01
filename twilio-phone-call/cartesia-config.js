/**
 * Cartesia.ai TTS Configuration
 * Shared configuration for consistent audio format across the application
 */

const CARTESIA_CONFIG = {
  // Audio output format configuration
  outputFormat: {
    container: 'wav',
    encoding: 'pcm_f32le',
    sample_rate: 44100
  },

  // Default voice configuration
  voice: {
    mode: 'id',
    id: '28ca2041-5dda-42df-8123-f58ea9c3da00' // Natural female voice
  },

  // API configuration
  api: {
    model_id: 'sonic-3',
    speed: 'normal',
    generation_config: {
      speed: 1,
      volume: 1
    }
  }
};

module.exports = CARTESIA_CONFIG;
