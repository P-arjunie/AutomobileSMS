#!/usr/bin/env node
import dotenv from 'dotenv';
import { sendMail } from '../utils/mailer.js';

dotenv.config();

async function main() {
  const to = process.env.EMAIL_TO;
  if (!to) {
    console.log('[email:test] Please set EMAIL_TO in your .env to run this test.');
    process.exit(0);
  }

  console.log(`[email:test] Sending test email to ${to} ...`);
  const res = await sendMail({
    to,
    subject: 'Automobile SMS: Test Email',
    html: '<p>This is a test email from Automobile SMS.</p>'
  });

  if (res?.skipped) {
    console.log('[email:test] SMTP not configured; email send skipped. Set SMTP_HOST/PORT/USER/PASS to enable.');
    process.exit(0);
  }

  if (res?.ok) {
    console.log('[email:test] Email sent successfully. Message ID:', res.id || 'N/A');
    process.exit(0);
  } else {
    console.error('[email:test] Failed to send email:', res?.error || 'Unknown error');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[email:test] Unexpected error:', err);
  process.exit(1);
});
