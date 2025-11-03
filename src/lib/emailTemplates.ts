export interface InquiryEmailData {
  name: string;
  email: string;
  phone?: string;
  inquiryType: string;
  message: string;
  inquiryId: number;
}

export const generateInquiryNotificationEmail = (data: InquiryEmailData) => {
  const { name, email, phone, inquiryType, message, inquiryId } = data;
  
  return {
    subject: `New Inquiry: ${inquiryType} from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #96885f 0%, #7a6f4d 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Burg Ink</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">New Inquiry Received</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #96885f;">
            <h2 style="color: #333; margin-top: 0; font-size: 20px; font-weight: 600;">Inquiry Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; width: 120px; color: #555;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #555;">Email:</td>
                <td style="padding: 8px 0;">
                  <a href="mailto:${email}" style="color: #96885f; text-decoration: none; font-weight: 500;">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #555;">Phone:</td>
                <td style="padding: 8px 0;">
                  <a href="tel:${phone}" style="color: #96885f; text-decoration: none; font-weight: 500;">${phone}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #555;">Type:</td>
                <td style="padding: 8px 0; text-transform: capitalize; color: #333;">${inquiryType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #555;">Date:</td>
                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #555;">ID:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace;">#${inquiryId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #ffffff; padding: 25px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0; font-size: 18px; font-weight: 600;">Message</h3>
            <div style="line-height: 1.6; color: #555; white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px;">${message}</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              This inquiry was submitted through the Burg Ink website.
            </p>
            <p style="color: #6c757d; font-size: 14px; margin: 5px 0 0 0;">
              Please respond within 24-48 hours to maintain excellent customer service.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Burg Ink. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
};

export const generateInquiryConfirmationEmail = (data: InquiryEmailData) => {
  const { name, inquiryType } = data;
  
  return {
    subject: `Thank you for your inquiry - Burg Ink`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #96885f 0%, #7a6f4d 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Burg Ink</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; font-weight: 600;">Thank you for your inquiry!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Hi ${name},
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Thank you for reaching out about your ${inquiryType} inquiry. I've received your message and will review it carefully.
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            I typically respond to all inquiries within <strong>2-3 business days</strong>. If you have any urgent questions, please don't hesitate to reach out directly.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #96885f;">
            <h3 style="color: #333; margin-top: 0; font-size: 18px;">What happens next?</h3>
            <ul style="color: #555; line-height: 1.6; padding-left: 20px;">
              <li>I'll review your inquiry and gather any necessary information</li>
              <li>You'll receive a detailed response with next steps</li>
              <li>If applicable, we'll schedule a consultation or discuss project details</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            I'm excited to work with you and bring your vision to life!
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Best regards,<br>
            <strong>Andrea</strong><br>
            Burg Ink
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Burg Ink. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
};

export interface UserInvitationEmailData {
  name: string;
  email: string;
  role: string;
  invitationLink: string;
  invitedBy?: string;
}

export const generateUserInvitationEmail = (data: UserInvitationEmailData) => {
  const { name, email, role, invitationLink, invitedBy } = data;
  
  return {
    subject: `You've been invited to join Burg Ink`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #96885f 0%, #7a6f4d 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Burg Ink</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You're Invited!</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px; font-weight: 600;">Welcome to Burg Ink!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Hi ${name || email},
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            ${invitedBy ? `You've been invited by ${invitedBy} to` : 'You\'ve been invited to'} join the Burg Ink platform${role !== 'user' ? ` as a ${role}` : ''}.
          </p>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Click the button below to accept your invitation and create your account:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="display: inline-block; padding: 16px 32px; background: #96885f; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 14px; text-align: center;">
            Or copy and paste this link into your browser:<br>
            <a href="${invitationLink}" style="color: #96885f; word-break: break-all;">${invitationLink}</a>
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #96885f;">
            <h3 style="color: #333; margin-top: 0; font-size: 18px;">What's next?</h3>
            <ul style="color: #555; line-height: 1.6; padding-left: 20px; margin: 0;">
              <li>Click the invitation link above</li>
              <li>Create your account password</li>
              <li>Complete your profile</li>
              <li>Start using the platform!</li>
            </ul>
          </div>
          
          <p style="color: #888; line-height: 1.6; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <strong>Note:</strong> This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Burg Ink. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
};
