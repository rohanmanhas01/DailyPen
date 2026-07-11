const sendEmail = async ({ to, subject, html }) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  const apiKey = process.env.BREVO_SMTP_KEY;
  const senderEmail = process.env.EMAIL_FROM_ADDRESS;
  const senderName = process.env.EMAIL_FROM_NAME || 'DailyPen';

  if (!apiKey || !senderEmail) {
    console.error('❌ Brevo API Key or Sender Email is missing in environment variables');
    throw new Error('Email configuration error');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API Error response:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    console.log('✉️ Email sent successfully via Brevo API! Message ID:', data.messageId);
    return data;
  } catch (error) {
    console.error('❌ Error sending email via Brevo API:', error);
    throw error;
  }
};

export default sendEmail;
