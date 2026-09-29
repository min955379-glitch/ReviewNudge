-- Add a required physical mailing address column to businesses.
-- CAN-SPAM and many international anti-spam laws require a valid postal
-- address in every commercial email. We make it required so onboarding
-- can't complete without one.
ALTER TABLE businesses ADD COLUMN mailing_address TEXT;

-- Backfill existing rows with an empty placeholder so existing dev data
-- doesn't break (new users will set it during onboarding).
UPDATE businesses SET mailing_address = '' WHERE mailing_address IS NULL;

ALTER TABLE businesses ALTER COLUMN mailing_address SET NOT NULL;
ALTER TABLE businesses ALTER COLUMN mailing_address SET DEFAULT '';
