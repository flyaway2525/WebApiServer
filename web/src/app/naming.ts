const spaceAdjectives = ['Amber', 'Blue', 'Crimson', 'Golden', 'Iron', 'Silver'];
const spaceNouns = ['Arena', 'Bank', 'Cup', 'Hall', 'League', 'Room'];
const hostNames = ['Host Alpha', 'Host Bravo', 'Host Delta', 'Host Echo', 'Host Nova'];
const guestNames = ['Guest Alpha', 'Guest Bravo', 'Guest Delta', 'Guest Echo', 'Guest Nova'];

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function createSuffix() {
  return String(Math.floor(Math.random() * 900) + 100);
}

export function createRandomSpaceName() {
  return `${pickRandom(spaceAdjectives)} ${pickRandom(spaceNouns)} ${createSuffix()}`;
}

export function createRandomHostDisplayName() {
  return `${pickRandom(hostNames)} ${createSuffix()}`;
}

export function createRandomGuestDisplayName() {
  return `${pickRandom(guestNames)} ${createSuffix()}`;
}