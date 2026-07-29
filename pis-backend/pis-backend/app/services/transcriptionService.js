const axios = require('axios');
const fs = require('fs');

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

const transcribeAudioFile = async (filePath) => {
  const headers = { authorization: process.env.ASSEMBLYAI_API_KEY };

  const audioData = fs.readFileSync(filePath);
  const uploadRes = await axios.post(`${ASSEMBLYAI_BASE}/upload`, audioData, {
    headers: { ...headers, 'content-type': 'application/octet-stream' },
  });
  const audioUrl = uploadRes.data.upload_url;

  const transcriptRes = await axios.post(
    `${ASSEMBLYAI_BASE}/transcript`,
    { audio_url: audioUrl },
    { headers }
  );
  const transcriptId = transcriptRes.data.id;

  let transcript;
  while (true) {
    const pollRes = await axios.get(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, { headers });
    transcript = pollRes.data;
    if (transcript.status === 'completed') break;
    if (transcript.status === 'error') throw new Error(transcript.error);
    await new Promise(r => setTimeout(r, 3000));
  }

  return transcript.text;
};

module.exports = { transcribeAudioFile };