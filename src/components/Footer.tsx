import React from 'react';
import { useAppContext } from '../context/AppContext';
import { XIcon, FacebookIcon, WhatsAppIcon, TikTokIcon, InstagramIcon, LinkedInIcon, GitHubIcon, EmailIcon, PhoneIcon } from '../constants';
import { SocialLink } from '../types';

const SocialIcon: React.FC<{ link: SocialLink }> = ({ link }) => {
    const components = {
        X: XIcon,
        Facebook: FacebookIcon,
        WhatsApp: WhatsAppIcon,
        TikTok: TikTokIcon,
        Instagram: InstagramIcon,
        LinkedIn: LinkedInIcon,
        GitHub: GitHubIcon,
        Email: EmailIcon,
        Phone: PhoneIcon,
    };
    
    const IconComponent = components[link.icon];
    const url = (link.icon === 'Email' ? `mailto:${link.url}` : link.icon === 'Phone' ? `tel:${link.url}` : link.url);

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={link.icon} className="text-gray-400 hover:text-brand-teal transition-colors">
            <IconComponent className="w-5 h-5" />
        </a>
    );
};

const Footer: React.FC = () => {
    const { footerSettings } = useAppContext();

    return (
        <footer className="w-full py-6 px-4 flex flex-col items-center justify-center space-y-3 flex-shrink-0">
             <div className="flex items-center space-x-5">
                 {footerSettings.socialLinks.map(link => (
                    <SocialIcon key={link.id} link={link} />
                 ))}
             </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{footerSettings.copyright.replace('*c', '©')}</p>
        </footer>
    );
};

export default Footer;