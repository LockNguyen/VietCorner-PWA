// What is switched off for now (the pastor's review, 2026-10-12). Nothing was deleted: `true` brings a
// line back as it was. An off page or route answers 404 before doing anything, so its screen is never
// downloaded by a phone; its tables and their rules stay as they are.
// Every place that reads a switch is found by searching for its name.
export const SWITCHES = {
  chat: false, // a group's conversation: /groups/<id>, POST /api/chat/messages and its notification
  joining: false, // asking to join a group, the admin's "Waiting to join" list, and both their notifications
  oldGroupsPage: false, // the Groups list whose rows join a group or open its chat; off = the group-info page instead
  eventChangePush: false, // "cancelled" / "back on" to everyone who could see the event
  eventReminders: false, // the reminders before an event, and the switches that set them
  prayedForPush: false, // "N people prayed for you" to a request's author
  namePush: false, // a name waiting for approval (to managers), a name approved (to the person)
} as const;
