// The signed-in person's own row of `profiles` (schema.sql).
export type Profile = {
  name: string;
  named: boolean; // false = `name` is still the stand-in made from their email, and they are yet to be asked
};

// Other people's names by user id: what a screen that shows people is handed.
export type Names = Record<string, string>;

// why: the database rejects anything longer (schema.sql); the field stops the typing at the same number.
export const MAX_NAME_LENGTH = 60;
