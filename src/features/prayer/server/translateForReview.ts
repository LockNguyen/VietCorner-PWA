import "server-only";
import { notifyReviewers } from "./notifyReviewers";
import { translateRequest } from "./translateRequest";

// What follows a post or an edit (the routes' `after`): translate the words, then tell the reviewers, whether or
// not the AI service answered: either way the request now waits on their list, to approve or to write.
export async function translateForReview(requestId: string) {
  await translateRequest(requestId);
  await notifyReviewers();
}
