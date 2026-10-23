import { describe, it, expect, beforeEach } from "vitest";

// In-memory matching test simulation matching the PostgreSQL function contract
interface Swipe {
  from_user_id: string;
  to_user_id: string;
  action: "like" | "pass";
  created_at: string;
}

interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: "active" | "unmatched" | "blocked";
  created_at: string;
}

class TestMatchingEngine {
  swipes: Swipe[] = [];
  matches: Match[] = [];
  blocks: { blocker_id: string; blocked_id: string }[] = [];

  recordSwipe(actorId: string, targetId: string, action: "like" | "pass") {
    if (actorId === targetId) throw new Error("Cannot swipe on self");

    // Check blocks
    const isBlocked = this.blocks.some(
      (b) =>
        (b.blocker_id === actorId && b.blocked_id === targetId) ||
        (b.blocker_id === targetId && b.blocked_id === actorId)
    );
    if (isBlocked) throw new Error("Blocked users cannot swipe each other");

    // Remove prior swipe from directed pair
    this.swipes = this.swipes.filter(
      (s) => !(s.from_user_id === actorId && s.to_user_id === targetId)
    );

    this.swipes.push({
      from_user_id: actorId,
      to_user_id: targetId,
      action,
      created_at: new Date().toISOString(),
    });

    if (action === "pass") {
      return { isMatch: false };
    }

    // Check reciprocal like
    const reciprocal = this.swipes.find(
      (s) => s.from_user_id === targetId && s.to_user_id === actorId && s.action === "like"
    );

    if (reciprocal) {
      // Canonical ordering: a < b
      const user_a_id = actorId < targetId ? actorId : targetId;
      const user_b_id = actorId < targetId ? targetId : actorId;

      let match = this.matches.find(
        (m) => m.user_a_id === user_a_id && m.user_b_id === user_b_id
      );

      if (!match) {
        match = {
          id: `match-${user_a_id}-${user_b_id}`,
          user_a_id,
          user_b_id,
          status: "active",
          created_at: new Date().toISOString(),
        };
        this.matches.push(match);
      } else {
        match.status = "active";
      }

      return { isMatch: true, matchId: match.id };
    }

    return { isMatch: false };
  }
}

describe("Matching Algorithm Unit Tests", () => {
  let engine: TestMatchingEngine;

  beforeEach(() => {
    engine = new TestMatchingEngine();
  });

  it("should not create a match when User A likes User B without reciprocal like", () => {
    const res = engine.recordSwipe("user-1", "user-2", "like");
    expect(res.isMatch).toBe(false);
    expect(engine.matches.length).toBe(0);
  });

  it("should not create a match when User B passes on User A", () => {
    engine.recordSwipe("user-1", "user-2", "like");
    const res = engine.recordSwipe("user-2", "user-1", "pass");
    expect(res.isMatch).toBe(false);
    expect(engine.matches.length).toBe(0);
  });

  it("should create exactly one match with canonical ordering when both like each other", () => {
    engine.recordSwipe("user-b", "user-a", "like");
    const res = engine.recordSwipe("user-a", "user-b", "like");

    expect(res.isMatch).toBe(true);
    expect(engine.matches.length).toBe(1);

    const match = engine.matches[0];
    // Canonical pair ordering: user_a < user_b
    expect(match.user_a_id).toBe("user-a");
    expect(match.user_b_id).toBe("user-b");
    expect(match.status).toBe("active");
  });

  it("should prevent self swiping", () => {
    expect(() => engine.recordSwipe("user-1", "user-1", "like")).toThrow(
      "Cannot swipe on self"
    );
  });

  it("should prevent swiping when users are blocked", () => {
    engine.blocks.push({ blocker_id: "user-1", blocked_id: "user-2" });
    expect(() => engine.recordSwipe("user-2", "user-1", "like")).toThrow(
      "Blocked users cannot swipe each other"
    );
  });
});
