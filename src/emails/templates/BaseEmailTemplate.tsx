import React from 'react';

interface BaseEmailTemplateProps {
  children: React.ReactNode;
  recipientEmail?: string;
}

export const BaseEmailTemplate: React.FC<BaseEmailTemplateProps> = ({
  children,
  recipientEmail,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, sans-serif;
            background-color: #F4F4F5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .email-wrapper {
            width: 100%;
            background-color: #F4F4F5;
            padding: 20px 0;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .email-header {
            background-color: #F97316;
            padding: 32px;
            text-align: center;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            background-color: #FFFFFF;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 32px;
            font-weight: 700;
            color: #F97316;
            margin: 0 auto;
          }
          
          .email-content {
            padding: 32px;
          }
          
          .email-footer {
            background-color: #F4F4F5;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          
          .footer-slogan {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 12px 0;
          }
          
          .footer-copyright {
            font-size: 12px;
            color: #6B7280;
            margin: 0 0 16px 0;
          }
          
          .footer-links {
            margin: 16px 0;
          }
          
          .footer-link {
            color: #F97316;
            text-decoration: none;
            font-size: 12px;
            margin: 0 8px;
          }
          
          .footer-link:hover {
            text-decoration: underline;
          }
          
          .footer-email-info {
            font-size: 11px;
            color: #9CA3AF;
            margin-top: 16px;
          }
          
          @media only screen and (max-width: 600px) {
            .email-content {
              padding: 24px !important;
            }
            
            .email-header {
              padding: 24px !important;
            }
            
            .email-footer {
              padding: 20px 24px !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="email-wrapper">
          <div className="email-container">
            {/* Header */}
            <div className="email-header">
              <div className="logo">R</div>
            </div>

            {/* Content */}
            <div className="email-content">
              {children}
            </div>

            {/* Footer */}
            <div className="email-footer">
              <p className="footer-slogan">
                Le ravitaillement qui ne dort jamais 🌙
              </p>
              <p className="footer-copyright">
                © {currentYear} RAVITO. Tous droits réservés.
              </p>
              <div className="footer-links">
                <a href="https://ravito.ci" className="footer-link">ravito.ci</a>
                <span style={{ color: '#D1D5DB' }}>•</span>
                <a href="https://ravito.ci/cgu" className="footer-link">CGU</a>
                <span style={{ color: '#D1D5DB' }}>•</span>
                <a href="mailto:support@ravito.ci" className="footer-link">Support</a>
              </div>
              {recipientEmail && (
                <p className="footer-email-info">
                  Cet email a été envoyé à {recipientEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};
