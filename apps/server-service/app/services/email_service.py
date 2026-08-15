import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def _base_email_template(
        title: str,
        headline: str,
        content_html: str,
        cta_text: Optional[str] = None,
        cta_url: Optional[str] = None,
        subtext: Optional[str] = None,
    ) -> str:
        """
        Generates a rich, responsive, modern dark/light compatible HTML email template.
        """
        cta_button_html = ""
        if cta_text and cta_url:
            cta_button_html = f"""
            <div style="margin: 32px 0; text-align: center;">
              <a href="{cta_url}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                {cta_text} &rarr;
              </a>
              <p style="margin-top: 16px; font-size: 12px; color: #737373;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="{cta_url}" style="color: #000000; word-break: break-all; text-decoration: underline;">{cta_url}</a>
              </p>
            </div>
            """

        subtext_html = ""
        if subtext:
            subtext_html = f"""
            <p style="font-size: 12px; color: #737373; margin-top: 24px; line-height: 1.6; border-top: 1px solid #e5e5e5; padding-top: 16px;">
              {subtext}
            </p>
            """

        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{title}</title>
          <style>
            @media only screen and (max-width: 600px) {{
              .email-container {{ width: 100% !important; padding: 20px !important; }}
            }}
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
              <td align="center" style="padding: 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e5e5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                  <!-- Brand Header -->
                  <tr>
                    <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #f0f0f0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <div style="display: inline-block; background-color: #000000; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 800; letter-spacing: 1px;">
                              LEARNIO<span style="color: #60a5fa;">X</span>
                            </div>
                          </td>
                          <td align="right">
                            <span style="font-size: 11px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 1px;">Enterprise Security</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 36px 36px 24px 36px;">
                      <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #171717; letter-spacing: -0.5px;">
                        {headline}
                      </h1>
                      <div style="font-size: 14px; color: #404040; line-height: 1.6;">
                        {content_html}
                      </div>

                      {cta_button_html}

                      {subtext_html}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 36px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #525252;">
                        LearnioX Multi-Tenant Learning OS
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #a3a3a3; line-height: 1.5;">
                        This is an automated security email from LearnioX. If you did not initiate this request, please disregard or contact our security team immediately.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

    @classmethod
    async def send_email(cls, to_email: str, subject: str, html_content: str) -> bool:
        """
        Sends an HTML email via SMTP asynchronously, or logs to development console if SMTP is not configured.
        """
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            # Development Mode: Log rich email notification
            logger.info("=" * 70)
            logger.info("📧 [LOCAL DEV EMAIL DISPATCHER]")
            logger.info(f"To: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info("=" * 70)
            print(f"\n[DEV EMAIL to {to_email}] Subject: {subject}\n")
            return True

        def _send_sync():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
                msg["To"] = to_email

                part = MIMEText(html_content, "html")
                msg.attach(part)

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_TLS:
                        server.starttls()
                    if settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
                return True
            except Exception as exc:
                logger.error(f"Failed to send email to {to_email}: {str(exc)}")
                return False

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _send_sync)

    @classmethod
    async def send_verification_email(cls, to_email: str, name: str, token: str) -> bool:
        """
        Sends rich account verification email with 24-hour expiration token.
        """
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your LearnioX account"
        headline = "Welcome to LearnioX 👋"
        content_html = f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>Thank you for creating your account on LearnioX. To access your courses, curriculum dashboard, and institutions, please verify your email address by clicking the button below.</p>
        """
        subtext = "This verification link is valid for <strong>24 hours</strong>. If you did not create a LearnioX account, please safely ignore this email."

        html = cls._base_email_template(
            title=subject,
            headline=headline,
            content_html=content_html,
            cta_text="Verify Email Address",
            cta_url=verify_url,
            subtext=subtext,
        )

        logger.info(f"Generated verification link for {to_email}: {verify_url}")
        print(f"\n🔗 [VERIFICATION LINK]: {verify_url}\n")
        return await cls.send_email(to_email, subject, html)

    @classmethod
    async def send_password_reset_email(cls, to_email: str, name: str, token: str) -> bool:
        """
        Sends rich password reset email with 1-hour expiration token.
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset your LearnioX password"
        headline = "Password Reset Request 🔐"
        content_html = f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>We received a request to reset the password for your LearnioX account. You can set a new password by clicking the button below:</p>
        """
        subtext = "For security reasons, this reset link expires in <strong>1 hour</strong>. If you did not request a password reset, your account is safe and no changes have been made."

        html = cls._base_email_template(
            title=subject,
            headline=headline,
            content_html=content_html,
            cta_text="Reset My Password",
            cta_url=reset_url,
            subtext=subtext,
        )

        logger.info(f"Generated password reset link for {to_email}: {reset_url}")
        print(f"\n🔑 [PASSWORD RESET LINK]: {reset_url}\n")
        return await cls.send_email(to_email, subject, html)

    @classmethod
    async def send_password_changed_notification(cls, to_email: str, name: str) -> bool:
        """
        Sends confirmation email that password was successfully reset.
        """
        subject = "Your LearnioX password was changed"
        headline = "Password Successfully Updated ✅"
        content_html = f"""
        <p>Hi <strong>{name}</strong>,</p>
        <p>The password for your LearnioX account has been successfully updated.</p>
        <p>If you made this change, you can safely disregard this notice.</p>
        """
        subtext = "If you did NOT change your password, please contact our support team immediately to secure your account."

        html = cls._base_email_template(
            title=subject,
            headline=headline,
            content_html=content_html,
            subtext=subtext,
        )
        return await cls.send_email(to_email, subject, html)
