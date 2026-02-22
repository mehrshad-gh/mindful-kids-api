-- Emotion logs: child mood/emotion check-ins (for emotion wheel in app)
CREATE TABLE emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  emotion_id VARCHAR(50) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE emotion_logs IS 'Emotion wheel selections per child for mood tracking.';
CREATE INDEX idx_emotion_logs_child_id ON emotion_logs(child_id);
CREATE INDEX idx_emotion_logs_recorded_at ON emotion_logs(recorded_at);
