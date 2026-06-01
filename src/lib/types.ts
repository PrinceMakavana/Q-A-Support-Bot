export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SiteConfig {
  indexName: string;
  namespace: string;
  docId: string;
  siteName: string;
  llmsRules: string;
  url: string;
}
