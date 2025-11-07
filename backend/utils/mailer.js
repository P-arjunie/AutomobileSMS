import nodemailer from 'nodemailer'

// If credentials are missing, we log emails to console instead of attempting to send.
const hasEmailCreds = Boolean(process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD)

let transporter = null
if (hasEmailCreds) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  })
} else {
  console.warn('Mailer: EMAIL_USERNAME or EMAIL_PASSWORD not set. Emails will be logged to console instead of sent.')
}

export const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
    html
  }

  if (!hasEmailCreds) {
    // Development fallback: log the email to console so flows don't crash and you can copy the link
    console.log('--- Mailer fallback (not sent) ---')
    console.log('To:', to)
    console.log('Subject:', subject)
    if (text) console.log('Text:', text)
    if (html) console.log('HTML:', html)
    console.log('--- End mail ---')
    return Promise.resolve({ mocked: true })
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  } catch (err) {
    console.error('Failed to send email:', err)
    throw err
  }
}

export default sendEmail
