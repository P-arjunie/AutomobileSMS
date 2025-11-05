import nodemailer from 'nodemailer';

// Create a transporter using environment variables (Mailtrap or SMTP)
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP not configured. Emails will be skipped.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass }
  });

  return transporter;
};

let transporter = null;

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }
    if (!transporter) {
      // Skip silently when not configured
      return { skipped: true };
    }

    const from = process.env.MAIL_FROM || 'no-reply@automobilesms.local';

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[mailer] sent:', info.messageId, 'to:', to);
    }

    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error('[mailer] error:', err.message);
    return { ok: false, error: err.message };
  }
};

export const renderAppointmentEmail = ({ title, appointment }) => {
  const dt = new Date(appointment.scheduledDate).toLocaleString();
  const vehicle = appointment.vehicle
    ? `${appointment.vehicle.make} ${appointment.vehicle.model} • ${appointment.vehicle.year} • ${appointment.vehicle.licensePlate}`
    : 'Vehicle details';

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2>${title}</h2>
    <p>Service: <strong>${(appointment.serviceType || '').replace(/-/g, ' ')}</strong></p>
    <p>Date & Time: <strong>${dt}</strong></p>
    <p>Vehicle: <strong>${vehicle}</strong></p>
    ${appointment.description ? `<p>Description: ${appointment.description}</p>` : ''}
    <p>Status: <strong>${appointment.status}</strong></p>
    <hr />
    <p>Thank you for choosing Automobile SMS.</p>
  </div>
  `;
};
