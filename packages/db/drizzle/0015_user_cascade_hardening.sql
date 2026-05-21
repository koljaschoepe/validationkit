-- Nova-3a Bundle A (Sub-4 K2 + K3): GDPR-safe user-delete behaviour.
--
-- Switches 5 user-FKs from ON DELETE CASCADE to ON DELETE SET NULL so a
-- user delete preserves the workspace + compliance audit-trail rows.
-- Columns become nullable; DAL must tolerate a `null` foreign-key.
--
-- Schema-snapshot regenerate (drizzle-kit generate) is deferred — the
-- existing 0011_lame_speedball.sql + saas-pricing-sub-a snapshots have
-- pre-existing rename-conflicts that need a separate cleanup pass.

-- K2: workspace.owner_id  (cascade → set null, nullable)
ALTER TABLE "workspace" DROP CONSTRAINT "workspace_owner_id_user_id_fk";
ALTER TABLE "workspace" ALTER COLUMN "owner_id" DROP NOT NULL;
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_id_user_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- K3a: install_request.requester_id  (compliance audit-trail)
ALTER TABLE "install_request" DROP CONSTRAINT "install_request_requester_id_user_id_fk";
ALTER TABLE "install_request" ALTER COLUMN "requester_id" DROP NOT NULL;
ALTER TABLE "install_request" ADD CONSTRAINT "install_request_requester_id_user_id_fk"
  FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- K3b: install_decision.decider_id  (compliance audit-trail)
ALTER TABLE "install_decision" DROP CONSTRAINT "install_decision_decider_id_user_id_fk";
ALTER TABLE "install_decision" ALTER COLUMN "decider_id" DROP NOT NULL;
ALTER TABLE "install_decision" ADD CONSTRAINT "install_decision_decider_id_user_id_fk"
  FOREIGN KEY ("decider_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- K3c: apply_action.decided_by  (compliance audit-trail)
ALTER TABLE "apply_action" DROP CONSTRAINT "apply_action_decided_by_user_id_fk";
ALTER TABLE "apply_action" ALTER COLUMN "decided_by" DROP NOT NULL;
ALTER TABLE "apply_action" ADD CONSTRAINT "apply_action_decided_by_user_id_fk"
  FOREIGN KEY ("decided_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- K3d: dpa_acceptance.user_id  (compliance audit-trail — GDPR Art. 28)
ALTER TABLE "dpa_acceptance" DROP CONSTRAINT "dpa_acceptance_user_id_user_id_fk";
ALTER TABLE "dpa_acceptance" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "dpa_acceptance" ADD CONSTRAINT "dpa_acceptance_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
