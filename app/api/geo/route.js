import { list } from '../../../lib/geo';
export function GET(req) {
  const q = new URL(req.url).searchParams;
  return Response.json(list(q.get('level'), q.get('parent') || ''), { headers: { 'Cache-Control': 'public, max-age=86400' } });
}
