const express = require('express');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();
const { transcribeAudioFile } = require('../services/transcriptionService');

const upload = multer({ dest: 'uploads/' });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
  try {
    const text = await transcribeAudioFile(req.file.path);
    fs.unlink(req.file.path, () => {});
    res.json({ transcript: text });
  } catch (err) {
    console.error('Transcription error:', err.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

module.exports = router;