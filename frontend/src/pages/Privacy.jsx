import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

const Privacy = () => {
  return (
    <div className="px-6 py-12 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-dark-800">
        <div className="p-3 bg-primary-600/10 rounded-xl text-primary-500">
          <FaShieldAlt size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-gray-500 mt-1">Last Updated: February 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, upload a video, or contact us for support. This includes:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
            <li>Account data: Username, email address, and encrypted passwords.</li>
            <li>Profile data: Display names, bios, and social media links.</li>
            <li>SSO data: If you use GitHub or Google login, we collect your unique identifier from those platforms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            2. How We Use Your Information
          </h2>
          <p>
            Your information is used to provide and improve the SecTube experience, including:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
            <li>Maintaining your watch history and saved videos.</li>
            <li>Processing and delivering video content.</li>
            <li>Protecting the security of our platform and users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            3. Data Storage and Security
          </h2>
          <p>
            We use industry-standard security measures to protect your data. Video files are processed through secure pipelines, and user credentials are encrypted using bcrypt. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            4. Third-Party Services
          </h2>
          <p>
            We utilize trusted third-party providers for specific functionalities:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
            <li><strong>Cloudinary</strong>: For secure image and video asset storage.</li>
            <li><strong>OAuth Providers</strong>: GitHub and Google for secure authentication.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            5. Your Rights
          </h2>
          <p>
            You have the right to access, correct, or delete your personal information at any time through your account settings. If you wish to permanently delete your account, please contact us.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
