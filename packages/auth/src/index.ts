export { getAuth, isAuthEnabled, type AuthInstance } from "./server.js";

// Sub-Plan-C V2 — transactional emails.
export {
  sendTransactionalEmail,
  type SendTransactionalEmailArgs,
  type SendTransactionalEmailResult,
} from "./emails/sender.js";
export {
  PrepaidPackExpireWarning,
  type PrepaidPackExpireWarningProps,
} from "./emails/PrepaidPackExpireWarning.js";
export {
  SubscriptionPastDue,
  type SubscriptionPastDueProps,
} from "./emails/SubscriptionPastDue.js";
export {
  PlanChangeConfirmation,
  type PlanChangeConfirmationProps,
} from "./emails/PlanChangeConfirmation.js";
