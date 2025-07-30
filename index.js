import express from 'express';
import cors from 'cors'; // <-- thêm dòng này
import axios from 'axios';

const app = express();
app.use(cors()); // <-- thêm dòng này để cho phép CORS
app.use(express.json());

app.post('/api/tts', async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text in body', body: req.body });

  try {
    // Chia văn bản thành các đoạn nhỏ hơn 200 ký tự
    const MAX_LENGTH = 199; // Giới hạn an toàn dưới 200 ký tự
    let allAudioUrls = [];
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
      const chunk = text.substring(i, i + MAX_LENGTH);
      // Lấy tất cả các URL audio từ google-tts-api cho từng đoạn văn bản
      // Xây dựng URL thủ công để kiểm soát tốt hơn
      const encodedChunk = encodeURIComponent(chunk);
      const chunkAudioUrls = [{
        url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedChunk}&tl=vi-VN&total=1&idx=0&textlen=${chunk.length}&client=tw-ob&ttsspeed=1`
      }];
      allAudioUrls = allAudioUrls.concat(chunkAudioUrls);
    }

    // Thiết lập header trả về file mp3
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="tts.mp3"'
    });

    // Tải và nối các luồng âm thanh
    for (const urlObj of allAudioUrls) {
      const url = urlObj.url; // Lấy URL từ đối tượng
      const audioStream = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      audioStream.data.pipe(res, { end: false });
      await new Promise(resolve => audioStream.data.on('end', resolve));
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server listening on port 3000'));
