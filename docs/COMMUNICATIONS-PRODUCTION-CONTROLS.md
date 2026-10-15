# Academy OS outbound school communications: approved operating controls

**Built-in policy, not legal advice:** Messages may be sent only by employees with authorized campus access and after positive, channel-specific student consent. The sender must confirm the exact message and recipient. If a student has opted out, neither a draft nor a new consent checkbox can silently reset their opt-out.

**SMS quiet hours:** Texts are blocked on Sunday or outside 9:00 a.m.–6:00 p.m. on Monday–Saturday in the **campus's** local time. North Carolina is America/New_York and Dallas/Mansfield are America/Chicago. Unknown campus state means SMS remains blocked until corrected. This is a conservative school policy, not a representation of the only hours allowed by law.

**Consent source:** Staff must describe where and when affirmative SMS permission was obtained; authenticated school records stamp the employee and time. Original lead/event consent evidence is preserved while later contact-choice changes are separately timestamped. Students' STOP requests must be promptly recorded as smsOptOut and do not become active again just because someone edits a checkbox.

**Message integrity:** Staff may save/edit an Email or SMS **Draft**, not an Accepted, Delivered or Failed provider record. Only the dedicated communications service can create provider send attempts. A message whose outcome is unknown must not be automatically retried, as it could already have been sent.

**External-service status:** Twilio/Resend credentials are currently unverified. The endpoint does not send without explicit approved credentials. Inbound STOP/START processing, sender registration, webhook signatures, delivery-status reconciliation and final messaging-policy/legal acceptance are **not implemented or approved**. Do not advertise automated messaging as complete or integrate real opted-in contact lists until these are signed off.

## Synthetic acceptance test

Use fictional recipient emails and phone numbers, staff accounts in Greensboro, Mansfield and Dallas and fixed dates representing local morning, after-hours and Sunday. Verify opt-in provenance, opt-out irreversibility, campus scoping, SMS quiet hours, no forged provider records and no duplicate sends. Later connect only approved provider test credentials, never actual student details during unapproved readiness tests.
