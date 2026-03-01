"use client";

import { useState } from "react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string | null;
  initials: string;
  location: string;
}

export default function TeamCard({ member }: { member: TeamMember }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="team-card">
      <div className="team-card-image">
        {member.image && !imgFailed ? (
          <img
            src={member.image}
            alt={member.name}
            width={200}
            height={220}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="team-avatar-fallback">{member.initials}</div>
        )}
      </div>
      <div className="team-card-info">
        <h3>{member.name}</h3>
        <span className="team-role">{member.role}</span>
        <p className="team-bio">{member.bio}</p>
        <span className="team-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {member.location}
        </span>
      </div>
    </div>
  );
}
