export const contactNotificationTemplate = (
  name: string,
  email: string,
  message: string,
) => `
<h2>New Contact Request</h2>

<p><b>Name:</b> ${name}</p>
<p><b>Email:</b> ${email}</p>

<h3>Message</h3>

<p>${message}</p>
`;
