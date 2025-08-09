// Dummy data for bushfire roster management system

// Personnel Table
export const personnel = [
  { id: 1, name: 'Alice Smith', role: 'Firefighter', skills: ['driver'], contact: 'alice@example.com', phone: '0400000001', availability: 'on-duty' },
  { id: 2, name: 'Bob Jones', role: 'Firefighter', skills: ['paramedic'], contact: 'bob@example.com', phone: '0400000002', availability: 'off-duty' },
  { id: 3, name: 'Carol Lee', role: 'Station Officer', skills: ['crew leader'], contact: 'carol@example.com', phone: '0400000003', availability: 'on-duty' },
  { id: 4, name: 'David Kim', role: 'Firefighter', skills: ['driver', 'paramedic'], contact: 'david@example.com', phone: '0400000004', availability: 'holiday' },
  { id: 5, name: 'Eve Brown', role: 'Firefighter', skills: [], contact: 'eve@example.com', phone: '0400000005', availability: 'sick' },
];

// Roster Table
export const roster = [
  { date: '2025-08-09', shift: 'Day', assigned: [1, 3], status: 'confirmed' },
  { date: '2025-08-09', shift: 'Night', assigned: [2, 4], status: 'pending' },
];

// Leave Table
export const leave = [
  { memberId: 4, start: '2025-08-08', end: '2025-08-12', reason: 'Holiday', approved: true },
  { memberId: 5, start: '2025-08-09', end: '2025-08-10', reason: 'Sick', approved: true },
];

// Incident Table
export const incidents = [
  { id: 1, date: '2025-08-09', location: 'Blue Mountains', size: 'large', danger: 'Critical', assigned: [1, 3] },
  { id: 2, date: '2025-08-08', location: 'Ballarat', size: 'small', danger: 'Medium', assigned: [2] },
];

// Settings Table
export const settings = {
  dangerThresholds: {
    low: 2,
    medium: 4,
    high: 6,
    critical: 10
  },
  resourceRules: {
    small: 1,
    medium: 2,
    large: 3
  }
};
