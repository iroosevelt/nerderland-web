// lib/generateUniqueUsername.ts

import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

// List of adjectives and nouns for generating usernames
const adjectives = [
  "Awesome",
  "Brilliant",
  "Cool",
  "Dynamic",
  "Epic",
  "Fantastic",
  "Great",
  "Happy",
  "Incredible",
  "Jazzy",
  "Kind",
  "Lovely",
  "Magical",
  "Nice",
  "Outstanding",
  "Perfect",
  "Quick",
  "Radiant",
  "Super",
  "Terrific",
  "Ultimate",
  "Vibrant",
  "Wonderful",
  "Xtra",
  "Young",
  "Zealous",
  "Smart",
  "Clever",
  "Swift",
  "Bold",
  "Brave",
  "Creative",
  "Cosmic",
  "Digital",
  "Electric",
  "Fluid",
  "Golden",
  "Hyper",
  "Infinite",
  "Lunar",
  "Mystic",
  "Neon",
  "Omega",
  "Pixel",
  "Quantum",
  "Retro",
  "Stellar",
  "Turbo",
  "Ultra",
  "Vector",
];

const nouns = [
  "Coder",
  "Hacker",
  "Ninja",
  "Wizard",
  "Guru",
  "Master",
  "Expert",
  "Geek",
  "Nerd",
  "Developer",
  "Designer",
  "Creator",
  "Builder",
  "Maker",
  "Inventor",
  "Innovator",
  "Pioneer",
  "Explorer",
  "Voyager",
  "Adventurer",
  "Hero",
  "Legend",
  "Champion",
  "Warrior",
  "Knight",
  "Sage",
  "Scholar",
  "Thinker",
  "Dreamer",
  "Visionary",
  "Artist",
  "Craftsman",
  "Engineer",
  "Architect",
  "Scientist",
  "Researcher",
  "Analyst",
  "Strategist",
  "Phantom",
  "Ghost",
  "Spirit",
  "Soul",
  "Mind",
  "Brain",
  "Force",
  "Power",
  "Energy",
  "Spark",
];

/**
 * Generates a unique username by combining adjective + noun + number
 */
export async function generateUniqueUsername(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random username
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999) + 1;

    const username = `${adjective}${noun}${number}`;

    try {
      // Check if username already exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser.length === 0) {
        return username;
      }
    } catch (error) {
      console.error("Error checking username uniqueness:", error);
    }

    attempts++;
  }

  // Fallback: use timestamp if all attempts failed
  const timestamp = Date.now();
  const fallbackUsername = `User${timestamp}`;

  console.warn(
    `Failed to generate unique username after ${maxAttempts} attempts, using fallback: ${fallbackUsername}`
  );
  return fallbackUsername;
}
