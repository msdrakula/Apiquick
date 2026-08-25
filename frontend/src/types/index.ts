export interface HeaderItem {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface ParamItem {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  auth_type?: string;
  auth?: Record<string, any>;
  pre_request_script?: string;
  test_script?: string;
  variables?: Array<{ key: string; value: string; enabled?: boolean; secret?: boolean }>;
  created_at?: string;
  updated_at?: string;
}

export interface CaptureRule {
  path: string;
  key: string;
  target: 'environment' | 'globals' | 'collection';
}

export interface RequestItem {
  id: number;
  collection_id: number;
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  params: ParamItem[];
  body_type: string;
  body_content: string;
  body_raw_type: string;
  auth_type: string;
  auth: Record<string, any>;
  pre_request_script: string;
  test_script: string;
  captures?: CaptureRule[];
  grpc_service?: string;
  grpc_method?: string;
  grpc_proto?: string;
  grpc_message?: string;
  folder?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Environment {
  id: number;
  name: string;
  variables: Array<{ key: string; value: string; enabled?: boolean; secret?: boolean }>;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalVar {
  id: number;
  key: string;
  value: string;
  secret: number;
  created_at?: string;
  updated_at?: string;
}

export interface HistoryItem {
  id: number;
  request_id?: number;
  name?: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  params: ParamItem[];
  body_type: string;
  body_content?: string;
  response_status?: number;
  response_status_text?: string;
  response_headers: HeaderItem[];
  response_body?: string;
  response_time_ms?: number;
  timeline?: Array<{ name: string; start: number; end: number }>;
  cookies?: any[];
  test_results?: any[];
  executed_at?: string;
}

export interface ExecuteResponse {
  status: number;
  statusText: string;
  headers: HeaderItem[];
  body: string;
  timeMs: number;
  timeline: Array<{ name: string; start: number; end: number }>;
  cookies: any[];
  testResults?: any[];
  error?: boolean;
}

export interface CookieItem {
  id: number;
  domain: string;
  name: string;
  value: string;
  path: string;
  secure: number;
  http_only: number;
  expires?: string;
}

export interface Tab {
  id: string;
  request: RequestItem;
  dirty: boolean;
  response?: ExecuteResponse;
  previousResponse?: ExecuteResponse;
  loading?: boolean;
  runSummary?: string;
  wsMessages?: Array<{ type: 'in' | 'out' | 'status'; data: string; time: string }>;
}
