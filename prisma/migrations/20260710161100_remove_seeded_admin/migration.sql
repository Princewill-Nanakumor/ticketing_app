-- Remove the pre-seeded admin so that email can register normally.
-- Admin role is granted on registration via isAdminEmail() in app code.
DELETE FROM "User" WHERE "email" = 'daviddillion272@gmail.com';
