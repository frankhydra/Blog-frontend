import apiClient from '../api/client';

// A plain <a href="/admin/subscribers/export"> can't carry the Bearer
// token apiClient attaches to every request (see api/client.js - auth is
// token-based, not cookie-based), so a direct link to an authed download
// endpoint would just 401. This fetches the file through apiClient
// instead and triggers the save via a throwaway object URL, which is the
// standard workaround for downloading an authenticated response.
export default async function downloadFile(url, filename) {
  const res = await apiClient.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
