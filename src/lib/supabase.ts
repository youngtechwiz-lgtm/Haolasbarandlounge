import { createClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfig: SupabaseConfig | null =
  rawUrl && rawAnonKey
    ? {
        url: rawUrl.replace(/\/$/, ''),
        anonKey: rawAnonKey,
      }
    : null;

export const isSupabaseConfigured = Boolean(supabaseConfig);

export const supabase = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export class SupabaseConnectionError extends Error {
  constructor(message = 'Supabase connection is not configured.') {
    super(message);
    this.name = 'SupabaseConnectionError';
  }
}

async function requestHeaders(
  extra: Record<string, string> = {},
) {
  if (!supabaseConfig) {
    throw new SupabaseConnectionError();
  }

  const result = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  return {
    apikey: supabaseConfig.anonKey,
    Authorization: `Bearer ${
      result.data.session?.access_token ?? supabaseConfig.anonKey
    }`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function supabaseFetch<T>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    query?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  if (!supabaseConfig) {
    throw new SupabaseConnectionError();
  }

  const method = options.method ?? 'GET';

  const response = await fetch(
    `${supabaseConfig.url}/rest/v1/${table}${options.query ?? ''}`,
    {
      method,
      headers: await requestHeaders({
        ...(method === 'POST' || method === 'PATCH'
          ? { Prefer: 'return=representation' }
          : {}),
        ...options.headers,
      }),
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Supabase request failed with ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function signInWithPassword(
  email: string,
  password: string,
) {
  if (!supabase) {
    throw new SupabaseConnectionError();
  }

  console.log('SUPABASE: Starting sign-in request...');
  console.log('SUPABASE: URL:', supabaseConfig?.url);

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          'Supabase login request timed out after 15 seconds. Check the Supabase URL, network connection, and Auth settings.',
        ),
      );
    }, 15000);
  });

  const request = supabase.auth.signInWithPassword({
    email,
    password,
  });

  const { data, error } = await Promise.race([
    request,
    timeout,
  ]);

  console.log('SUPABASE: Sign-in response received.');

  if (error) {
    console.error('SUPABASE: Sign-in error:', error);
    throw error;
  }

  console.log(
    'SUPABASE: Sign-in successful:',
    data.user?.id,
  );

  return data;
}

export async function uploadGalleryImage(
  path: string,
  file: File,
) {
  if (!supabase) {
    throw new SupabaseConnectionError();
  }

  const { error } = await supabase.storage
    .from('gallery-images')
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  return {
    path,
    publicUrl: supabase.storage
      .from('gallery-images')
      .getPublicUrl(path).data.publicUrl,
  };
}

export async function removeGalleryImage(path: string) {
  if (!supabase) {
    throw new SupabaseConnectionError();
  }

  const { error } = await supabase.storage
    .from('gallery-images')
    .remove([path]);

  if (error) {
    throw error;
  }
}