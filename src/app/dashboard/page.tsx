"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  bootstrap,
  linkedinGetProfile,
  swarmGetMembers,
  swarmGetSubmissions,
} from "@/lib/api";
import SwarmTab from "@/components/SwarmTab";
import FriendsTab from "@/components/FriendsTab";

type Tab = "swarm" | "friends";

interface ProfileData {
  status: string;
  linkedin_display_name: string | null;
  live_view_url: string | null;
}

interface MemberData {
  linkedin_display_name: string;
  likes_given: number;
}

interface SubmissionData {
  post_url: string;
  jobs_created: number;
  profiles_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("swarm");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [initialProfile, setInitialProfile] = useState<ProfileData | null>(
    null
  );
  const [initialMembers, setInitialMembers] = useState<MemberData[]>([]);
  const [initialSubmissions, setInitialSubmissions] = useState<
    SubmissionData[]
  >([]);
  const bootstrapAttempted = useRef(false);

  useEffect(() => {
    if (bootstrapAttempted.current) return;
    bootstrapAttempted.current = true;

    async function init() {
      const existingKey = localStorage.getItem("friendly-swarm-api-key");

      if (existingKey) {
        // Validate the existing key
        try {
          await linkedinGetProfile();
          setApiKey(existingKey);
          setBootstrapping(false);
          return;
        } catch {
          // Key invalid, re-bootstrap
          localStorage.removeItem("friendly-swarm-api-key");
        }
      }

      // Bootstrap: get a new API key
      try {
        const token = await getToken();
        if (!token) {
          console.error("No Clerk token available");
          setBootstrapping(false);
          return;
        }
        const result = await bootstrap(token);
        localStorage.setItem("friendly-swarm-api-key", result.api_key);
        setApiKey(result.api_key);
      } catch (err) {
        console.error("Bootstrap failed:", err);
      } finally {
        setBootstrapping(false);
      }
    }

    init();
  }, [getToken]);

  // Fetch all tab data in parallel once we have an API key
  useEffect(() => {
    if (!apiKey) return;

    async function fetchTabData() {
      const [profileResult, membersResult, submissionsResult] =
        await Promise.allSettled([
          linkedinGetProfile(),
          swarmGetMembers(),
          swarmGetSubmissions(),
        ]);

      if (profileResult.status === "fulfilled") {
        setInitialProfile(profileResult.value);
      }
      if (membersResult.status === "fulfilled") {
        setInitialMembers(membersResult.value);
      }
      if (submissionsResult.status === "fulfilled") {
        setInitialSubmissions(submissionsResult.value);
      }

      setTabsLoading(false);
    }

    fetchTabData();
  }, [apiKey]);

  if (bootstrapping) {
    return (
      <div className="page active">
        <div className="card card-small">
          <p className="body-text body-text-muted">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="page active">
        <div className="card card-small">
          <p className="body-text">
            Something went wrong setting up your account. Please try refreshing
            the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="card card-large">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "swarm" ? "active" : ""}`}
            onClick={() => setActiveTab("swarm")}
          >
            Swarm
          </button>
          <button
            className={`tab ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            Friends
          </button>
        </div>

        {tabsLoading ? (
          <div className="tab-content-loading">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div
              className={`tab-content ${activeTab === "swarm" ? "active" : ""}`}
            >
              <SwarmTab
                initialProfile={initialProfile}
                initialMembers={initialMembers}
                initialSubmissions={initialSubmissions}
              />
            </div>
            <div
              className={`tab-content ${activeTab === "friends" ? "active" : ""}`}
            >
              <FriendsTab members={initialMembers} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
