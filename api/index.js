import server from "../dist/server/server.js";

async function getWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const url = `${protocol}://${req.headers.host}${req.url}`;
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const options = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = await getRequestBody(req);
  }

  return new Request(url, options);
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

async function writeWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (webRes.body) {
    const arrayBuffer = await webRes.arrayBuffer();
    res.write(Buffer.from(arrayBuffer));
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const webReq = await getWebRequest(req);
    const webRes = await server.fetch(webReq);
    await writeWebResponse(webRes, res);
  } catch (error) {
    console.error('Bridge error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
