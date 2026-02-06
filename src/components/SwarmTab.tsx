"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  linkedinConnect,
  linkedinGetProfile,
  swarmGetSubmissions,
  swarmSubmitPost,
} from "@/lib/api";
import Toast from "./Toast";

type SwarmState = "disconnected" | "connecting" | "connected";

interface Submission {
  post_url: string;
  jobs_created: number;
  profiles_count: number;
  created_at: string;
}

interface Member {
  linkedin_display_name: string;
  likes_given: number;
}

interface SwarmTabProps {
  initialProfile: {
    status: string;
    linkedin_display_name: string | null;
    live_view_url: string | null;
  } | null;
  initialMembers: Member[];
  initialSubmissions: Submission[];
}

function deriveState(profile: SwarmTabProps["initialProfile"]): SwarmState {
  if (!profile) return "disconnected";
  if (profile.status === "connected") return "connected";
  if (profile.status === "live_view") return "connecting";
  return "disconnected";
}

function deriveStatsLine(members: Member[]): string {
  if (members.length === 0) return "";
  const totalLikes = members.reduce((sum, m) => sum + m.likes_given, 0);
  return `${totalLikes} likes facilitated for ${members.length} people.`;
}

export default function SwarmTab({
  initialProfile,
  initialMembers,
  initialSubmissions,
}: SwarmTabProps) {
  const [state, setState] = useState<SwarmState>(() =>
    deriveState(initialProfile)
  );
  const [displayName, setDisplayName] = useState<string | null>(
    () => initialProfile?.linkedin_display_name ?? null
  );
  const [liveViewUrl, setLiveViewUrl] = useState<string | null>(
    () => initialProfile?.live_view_url ?? null
  );
  const [postUrl, setPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>(
    () => initialSubmissions
  );
  const [statsLine, setStatsLine] = useState<string>(() =>
    deriveStatsLine(initialMembers)
  );
  const [toast, setToast] = useState({ message: "", visible: false });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ message: "", visible: false });
  }, []);

  const fetchSubmissions = async () => {
    try {
      const subs = await swarmGetSubmissions();
      setSubmissions(subs);
    } catch {
      // Ignore errors
    }
  };

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollStartRef.current = Date.now();

    pollRef.current = setInterval(async () => {
      // Timeout after 5 minutes
      if (Date.now() - pollStartRef.current > 5 * 60 * 1000) {
        if (pollRef.current) clearInterval(pollRef.current);
        setState("disconnected");
        return;
      }

      try {
        const profile = await linkedinGetProfile();
        if (profile.status === "connected") {
          if (pollRef.current) clearInterval(pollRef.current);
          setState("connected");
          setDisplayName(profile.linkedin_display_name);
          fetchSubmissions();
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }, []);

  // If initial state is "connecting", start polling
  useEffect(() => {
    if (state === "connecting") {
      startPolling();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleLinkedInLogin = async () => {
    try {
      const result = await linkedinConnect();
      if (result.status === "already_connected") {
        setState("connected");
        const profile = await linkedinGetProfile();
        setDisplayName(profile.linkedin_display_name);
        fetchSubmissions();
        return;
      }
      if (result.live_view_url) {
        setLiveViewUrl(result.live_view_url);
        window.open(result.live_view_url, "_blank");
      }
      setState("connecting");
      startPolling();
    } catch (err) {
      console.error("LinkedIn connect error:", err);
      showToast("Failed to start LinkedIn login. Please try again.");
    }
  };

  const handleCancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setState("disconnected");
    setLiveViewUrl(null);
  };

  const handleBoost = async () => {
    const url = postUrl.trim();
    if (!url) return;

    if (
      !url.startsWith("https://www.linkedin.com/") &&
      !url.startsWith("https://linkedin.com/")
    ) {
      showToast("Please enter a valid LinkedIn URL.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await swarmSubmitPost(url);
      showToast(
        `${result.jobs_created} likes will be facilitated over the next 30 minutes.`
      );
      setPostUrl("");
      fetchSubmissions();
    } catch (err) {
      console.error("Boost error:", err);
      showToast("Failed to submit post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const isInProgress = (createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() < 30 * 60 * 1000;
  };

  // State A: Disconnected
  if (state === "disconnected") {
    return (
      <>
        <p className="body-text">
          You&apos;re about to join a friendly swarm. We are a group of people
          helping each other gain more exposure on LinkedIn. We do this by liking
          each other&apos;s posts automatically.
        </p>
        <p className="body-text">
          When you login below, we use those credentials for AI to go into your
          account and like a friend&apos;s post. Your account is secure. You can
          (and should) keep using your LinkedIn accounts like before.
        </p>
        <p className="body-text body-text-muted">
          {statsLine || ""}
        </p>
        <button className="btn-linkedin" onClick={handleLinkedInLogin}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffffff">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Login with LinkedIn
        </button>
        <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
      </>
    );
  }

  // State B: Connecting
  if (state === "connecting") {
    return (
      <div className="connecting-state">
        <div className="spinner" />
        <p className="body-text">Waiting for you to log in to LinkedIn...</p>
        <p className="body-text body-text-muted">
          A new window should have opened.
        </p>
        {liveViewUrl && (
          <a href={liveViewUrl} target="_blank" rel="noopener noreferrer">
            Open LinkedIn Login
          </a>
        )}
        <br />
        <button className="btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    );
  }

  // State C: Connected
  return (
    <>
      <p className="body-text">
        You&apos;re about to join a friendly swarm. We are a group of people
        helping each other gain more exposure on LinkedIn. We do this by liking
        each other&apos;s posts automatically.
      </p>
      <div className="connected-badge">
        <span className="connected-dot" />
        Connected{displayName ? ` as ${displayName}` : ""}
      </div>
      <p className="body-text body-text-muted">
        Once you submit your post, we will facilitate likes over the next 30
        mins in a randomized process.
      </p>
      <div className="post-form">
        <label className="input-label">Submit your LinkedIn post URL</label>
        <input
          type="text"
          className="input-field"
          placeholder="https://linkedin.com/posts/..."
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
        />
        <button
          className="btn-linkedin btn-boost"
          disabled={!postUrl.trim() || submitting}
          onClick={handleBoost}
        >
          {submitting ? "Submitting..." : "Boost from the Swarm"}
        </button>
      </div>
      <div className="submissions-section">
        <h3 className="section-label">Your submissions</h3>
        <div className="submissions-list">
          {submissions.length === 0 ? (
            <p className="empty-state">No posts submitted yet.</p>
          ) : (
            submissions.map((s, i) => (
              <div className="submission-item" key={i}>
                <a
                  href={s.post_url}
                  className="submission-date"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formatDate(s.created_at)}
                </a>
                {isInProgress(s.created_at) ? (
                  <span className="submission-status submission-status-active">
                    in progress
                  </span>
                ) : (
                  <span className="submission-likes">
                    {s.jobs_created} likes
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
    </>
  );
}
