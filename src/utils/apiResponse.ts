export async function parseApiResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.trim().slice(0, 300) || 'Invalid JSON response from server.');
  }
}

export async function parseErrorResponse(response: Response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data?.error || data?.message || text;
  } catch {
    return text || 'Unknown server error.';
  }
}
