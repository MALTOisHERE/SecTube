import React from 'react';
import { FaFileContract } from 'react-icons/fa';

const Terms = () => {
  return (
    <div className="px-6 py-12 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-dark-800">
        <div className="p-3 bg-primary-600/10 rounded-xl text-primary-500">
          <FaFileContract size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
          <p className="text-gray-500 mt-1">Last Updated: October 2023</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using SecTube, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            2. Educational Purpose & Ethical Conduct
          </h2>
          <p>
            SecTube is strictly for educational and informational purposes. Users are expected to maintain the highest standards of ethical conduct. 
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-400">
            <li>Do not use information found here to perform unauthorized attacks.</li>
            <li>Respect the principles of Responsible Disclosure.</li>
            <li>Only upload content for which you have the legal right to share.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            3. User Accounts
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. We reserve the right to refuse service or terminate accounts at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            4. Content Ownership
          </h2>
          <p>
            Streamers retain ownership of the content they upload but grant SecTube a non-exclusive license to host and display that content. SecTube does not claim ownership of user-generated research.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            5. Limitation of Liability
          </h2>
          <p>
            SecTube and its contributors shall not be held liable for any damages arising out of the use or inability to use the materials on the platform, including any misuse of technical information.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
