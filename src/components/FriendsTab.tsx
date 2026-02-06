"use client";

const ANIMAL_EMOJIS = [
  "\uD83D\uDC1D", // bee
  "\uD83E\uDD8B", // butterfly
  "\uD83D\uDC26", // bird
  "\uD83E\uDD8A", // fox
  "\uD83D\uDC19", // octopus
  "\uD83D\uDC22", // turtle
  "\uD83E\uDD8E", // lizard
  "\uD83D\uDC2C", // dolphin
  "\uD83E\uDD89", // owl
  "\uD83D\uDC3F\uFE0F", // chipmunk
  "\uD83D\uDC3B", // bear
  "\uD83E\uDD9C", // parrot
  "\uD83D\uDC28", // koala
  "\uD83E\uDD94", // hedgehog
  "\uD83E\uDD9D", // raccoon
];

interface Member {
  linkedin_display_name: string;
  likes_given: number;
}

function getEmoji(index: number): string {
  return ANIMAL_EMOJIS[index % ANIMAL_EMOJIS.length];
}

interface FriendsTabProps {
  members: Member[];
}

export default function FriendsTab({ members }: FriendsTabProps) {
  if (members.length === 0) {
    return <p className="empty-state">No members yet.</p>;
  }

  return (
    <>
      <p className="body-text">Here are friendly people in our swarm.</p>
      <ul className="friends-list">
        {members.map((member, i) => (
          <li className="friend-item" key={i}>
            <span className="friend-emoji">{getEmoji(i)}</span>
            <span className="friend-name">{member.linkedin_display_name}</span>
            <span className="friend-likes">
              gave {member.likes_given} likes
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
