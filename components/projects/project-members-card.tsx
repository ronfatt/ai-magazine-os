"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ProjectMembersCard({
  projectId,
  canManageMembers,
  members,
}: {
  projectId: string;
  canManageMembers: boolean;
  members: Array<{
    id: string;
    email: string;
    role: string;
    joinedAt: string;
  }>;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not add member.");
        return;
      }

      setEmail("");
      setRole("viewer");
      setMessage("Collaborator added to the project.");
      router.refresh();
    });
  }

  return (
    <article className="rounded-3xl border border-line bg-surface p-5">
      <p className="eyebrow">Collaborators</p>
      <h2 className="mt-3 text-2xl font-semibold">Project members</h2>
      <p className="mt-2 text-sm leading-7 text-ink-soft">
        First collaboration pass supports existing users who have already signed in once.
      </p>

      <div className="mt-5 space-y-3">
        {members.length > 0 ? (
          members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-medium text-ink">{member.email}</p>
                <p className="text-ink-soft">
                  Joined {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-strong">
                {member.role}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-ink-soft">
            No collaborators added yet.
          </div>
        )}
      </div>

      {canManageMembers ? (
        <form className="mt-5 space-y-3" onSubmit={handleInvite}>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@publication.com"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-ink-soft"
              required
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-ink-soft"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#201a17] px-4 py-2 text-sm font-medium text-[#f8f3ea] transition hover:bg-[#352a25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Adding member..." : "Add Existing User"}
          </button>
          {message ? (
            <div className="rounded-2xl border border-[#c9d8c0] bg-[#f4fbef] px-4 py-3 text-sm text-[#36522a]">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-[#d4a491] bg-[#fff4ef] px-4 py-3 text-sm text-[#8a3b1d]">
              {error}
            </div>
          ) : null}
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-ink-soft">
          Member management is limited to project owners and admins.
        </div>
      )}
    </article>
  );
}

