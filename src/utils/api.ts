export async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  let body: any = null;
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const message = body && body.error ? body.error : body?.message || response.statusText;
    throw new Error(message);
  }

  return body;
}

export default handleResponse;
