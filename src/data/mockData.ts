
// Mock teams data for the application
export const MOCK_TEAMS = [
  {
    id: 1,
    name: "Garage Verbeke",
    email: "garage.verbeke@example.com",
    played: 10,
    won: 8,
    draw: 1,
    lost: 1,
    goalDiff: 15,
    points: 25
  },
  {
    id: 2,
    name: "Shakthar Truuk",
    email: "shakthar.truu@example.com",
    played: 10,
    won: 7,
    draw: 2,
    lost: 1,
    goalDiff: 12,
    points: 23
  },
  {
    id: 3,
    name: "De Dageraad",
    email: "dageraad@example.com",
    played: 10,
    won: 6,
    draw: 2,
    lost: 2,
    goalDiff: 8,
    points: 20
  },
  {
    id: 4,
    name: "Cafe De Gilde",
    email: "cafe.degilde@example.com",
    played: 10,
    won: 5,
    draw: 3,
    lost: 2,
    goalDiff: 6,
    points: 18
  },
  {
    id: 5,
    name: "De Florre",
    email: "deflorre@example.com",
    played: 10,
    won: 4,
    draw: 4,
    lost: 2,
    goalDiff: 4,
    points: 16
  },
  {
    id: 6,
    name: "Bemarmi Boys",
    email: "bemarmi.boys@example.com",
    played: 10,
    won: 4,
    draw: 2,
    lost: 4,
    goalDiff: 0,
    points: 14
  }
];

// Mock players data per team
export const MOCK_TEAM_PLAYERS = {
  1: [ // Garage Verbeke
    { player_id: 1, player_name: "Jan Janssens", birth_date: "1995-03-15", team_id: 1, is_active: true },
    { player_id: 2, player_name: "Piet Peters", birth_date: "1992-07-22", team_id: 1, is_active: true },
    { player_id: 3, player_name: "Karel Karels", birth_date: "1988-11-08", team_id: 1, is_active: true },
    { player_id: 4, player_name: "Tom Tomson", birth_date: "1990-05-12", team_id: 1, is_active: true },
    { player_id: 5, player_name: "Luc Lucas", birth_date: "1993-09-30", team_id: 1, is_active: true },
    { player_id: 6, player_name: "Kris Kristof", birth_date: "1989-12-18", team_id: 1, is_active: true },
    { player_id: 7, player_name: "Mark Markus", birth_date: "1991-02-28", team_id: 1, is_active: true },
    { player_id: 8, player_name: "David Davis", birth_date: "1994-06-10", team_id: 1, is_active: true },
    { player_id: 9, player_name: "Steve Stevens", birth_date: "1987-08-25", team_id: 1, is_active: true },
    { player_id: 10, player_name: "Paul Pauls", birth_date: "1996-01-14", team_id: 1, is_active: true }
  ],
  2: [ // Shakthar Truuk
    { player_id: 11, player_name: "Barry Bavo", birth_date: "1993-04-20", team_id: 2, is_active: true },
    { player_id: 12, player_name: "Harry Havo", birth_date: "1991-08-15", team_id: 2, is_active: true },
    { player_id: 13, player_name: "Larry Lavo", birth_date: "1989-12-05", team_id: 2, is_active: true },
    { player_id: 14, player_name: "Gary Gavo", birth_date: "1992-03-18", team_id: 2, is_active: true },
    { player_id: 15, player_name: "Terry Tavo", birth_date: "1990-07-22", team_id: 2, is_active: true },
    { player_id: 16, player_name: "Jerry Javo", birth_date: "1988-11-30", team_id: 2, is_active: true },
    { player_id: 17, player_name: "Kerry Kavo", birth_date: "1994-02-12", team_id: 2, is_active: true },
    { player_id: 18, player_name: "Perry Pavo", birth_date: "1995-06-08", team_id: 2, is_active: true }
  ],
  3: [ // De Dageraad
    { player_id: 19, player_name: "Bob Bobbens", birth_date: "1990-09-10", team_id: 3, is_active: true },
    { player_id: 20, player_name: "Rob Robbens", birth_date: "1992-01-25", team_id: 3, is_active: true },
    { player_id: 21, player_name: "Job Jobbens", birth_date: "1988-05-14", team_id: 3, is_active: true },
    { player_id: 22, player_name: "Lob Lobbens", birth_date: "1991-10-03", team_id: 3, is_active: true },
    { player_id: 23, player_name: "Gob Gobbens", birth_date: "1993-03-28", team_id: 3, is_active: true },
    { player_id: 24, player_name: "Sob Sobbens", birth_date: "1989-07-16", team_id: 3, is_active: true },
    { player_id: 25, player_name: "Mob Mobbens", birth_date: "1994-12-21", team_id: 3, is_active: true }
  ]
};
