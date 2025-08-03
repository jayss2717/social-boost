import { ParsedUrlQuery } from 'querystring';

export const withHost = (path: string, query: ParsedUrlQuery) => {
  const shop = query.shop as string;
  const host = query.host as string;
  
  if (!shop) return path;
  
  const params = new URLSearchParams();
  params.set('shop', shop);
  if (host) {
    params.set('host', host);
  }
  
  return `${path}?${params.toString()}`;
}; 