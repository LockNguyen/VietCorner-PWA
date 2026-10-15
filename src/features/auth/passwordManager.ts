// Asks the phone's password manager to keep an email and password, so the person never types them again.
//
// Chrome (Android) lets a page ask directly, which shows its "Save password?" sheet. Safari has no such
// call: an iPhone offers to save by itself when a form with these fields is sent and then leaves the screen,
// which is why every password form here is a real <form> with `autoComplete` set.

type PasswordCredentialConstructor = new (data: { id: string; password: string }) => Credential;

export function rememberPassword(email: string, password: string): void {
  const PasswordCredential = (window as Window & { PasswordCredential?: PasswordCredentialConstructor })
    .PasswordCredential;
  if (!PasswordCredential) return;
  // A refusal, or no password manager, costs nothing: the person is already signed in.
  navigator.credentials.store(new PasswordCredential({ id: email, password })).catch(() => {});
}
