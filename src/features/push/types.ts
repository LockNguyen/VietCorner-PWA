// What a notification says. `public/sw.js` reads exactly these fields in its "push" handler.
export type PushNotification = {
  title: string;
  body: string;
  url: string; // where tapping the notification opens the app
};
