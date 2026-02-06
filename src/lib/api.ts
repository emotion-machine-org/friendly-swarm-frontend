const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getApiKey(): string | null {
  return localStorage.getItem("friendly-swarm-api-key");
}

function authHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) return {};
  return { Authorization: `Bearer ${key}` };
}

export async function bootstrap(
  clerkToken: string
): Promise<{ api_key: string; user_id: string; relationship_id: string }> {
  const res = await fetch(`${API_BASE}/api/v3/demo/bootstrap`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Bootstrap failed: ${res.status}`);
  return res.json();
}

export async function linkedinConnect(): Promise<{
  status: string;
  live_view_url: string | null;
}> {
  const res = await fetch(
    `${API_BASE}/api/v3/demo/linkedin/connect-api-key`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`LinkedIn connect failed: ${res.status}`);
  return res.json();
}

export async function linkedinGetProfile(): Promise<{
  status: string;
  linkedin_display_name: string | null;
  live_view_url: string | null;
}> {
  const res = await fetch(
    `${API_BASE}/api/v3/demo/linkedin/profile-api-key`,
    {
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error(`LinkedIn profile failed: ${res.status}`);
  return res.json();
}

export async function swarmSubmitPost(
  postUrl: string
): Promise<{
  success: boolean;
  jobs_created: number;
  profiles_count: number;
  message: string | null;
}> {
  const res = await fetch(`${API_BASE}/api/v3/demo/linkedin/swarm/post`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post_url: postUrl }),
  });
  if (!res.ok) throw new Error(`Swarm post failed: ${res.status}`);
  return res.json();
}

export async function swarmGetMembers(): Promise<
  Array<{ linkedin_display_name: string; likes_given: number }>
> {
  const res = await fetch(
    `${API_BASE}/api/v3/demo/linkedin/swarm/members`,
    {
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error(`Swarm members failed: ${res.status}`);
  return res.json();
}

export async function swarmGetSubmissions(): Promise<
  Array<{
    post_url: string;
    jobs_created: number;
    profiles_count: number;
    created_at: string;
  }>
> {
  const res = await fetch(
    `${API_BASE}/api/v3/demo/linkedin/swarm/submissions`,
    {
      headers: authHeaders(),
    }
  );
  if (!res.ok) throw new Error(`Swarm submissions failed: ${res.status}`);
  return res.json();
}
