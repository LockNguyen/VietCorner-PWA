// What a notification says. `public/sw.js` reads exactly these fields in its "push" handler.
export type PushNotification = {
  title: string;
  body: string;
  url: string; // where tapping the notification opens the app
  // What it is about: "chat:<group id>", "prayer". A user gets at most one notification per topic per
  // minute, and a newer one replaces the older one on the phone instead of stacking under it.
  // Leave it out for an announcement that must always arrive and never be replaced (an event called off).
  topic?: string;
};
