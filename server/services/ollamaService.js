const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export async function checkConnection() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listModels() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      digest: m.digest,
      modifiedAt: m.modified_at,
      label: m.name.split(':')[0]
    }));
  } catch {
    return [];
  }
}

/**
 * Stream chat response via Server-Sent Events
 */
export async function streamChat(req, res) {
  const { model, messages, systemPrompt, options = {} } = req.body;

  const ollamaMessages = [];
  if (systemPrompt) {
    ollamaMessages.push({ role: 'system', content: systemPrompt });
  }
  ollamaMessages.push(...messages);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || process.env.OLLAMA_DEFAULT_MODEL,
        messages: ollamaMessages,
        stream: true,
        ...options
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    req.on('close', () => {
      reader.cancel();
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const content = json.message?.content || '';
          fullResponse += content;
          res.write(
            `data: ${JSON.stringify({ content, full: fullResponse, done: json.done })}\n\n`
          );
        } catch {
          // Skip malformed
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (err.name !== 'AbortError') {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }
    res.end();
  }
}
