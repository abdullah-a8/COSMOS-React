import React, { useEffect } from 'react';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import Header from '../landing-page/Header';
import Footer from '../landing-page/Footer';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const { isMobile } = useDevice();

  // Ensure scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white antialiased relative overflow-x-hidden">
      {/* Ambient background with moving particles */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(55,48,163,0.15),rgba(0,0,0,0.5))]">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 60 : 100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          followMouse={false}
        />
      </div>

      <Header />
      
      <main className="relative z-10 container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(147,51,234,0.15)] p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600">
              Privacy Policy
            </h1>
            
            <div className="prose prose-invert prose-purple max-w-none text-gray-300">
              <p><strong>Effective Date:</strong> <strong className="text-violet-400">May 18th, 2025</strong></p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">1. Introduction and Scope</h2>
              <p className="mt-3">Welcome to <strong>COSMOS</strong> ("COSMOS," "we," "us," or "our"). COSMOS is a Collaborative Organized System for Multiple Operating Specialists, an integrated AI assistant platform developed and operated by Devosmic (collectively, the "Service").</p>
              <p className="mt-3">This Privacy Policy ("Policy") describes how Devosmic collects, uses, processes, shares, and protects Personal Data when you access or use our Service. It also explains your rights regarding your Personal Data.</p>
              <p className="mt-3">This Policy applies to all users of the COSMOS platform, including its website, applications, and related services. By accessing or using the Service, you signify your understanding of and agreement to the terms of this Privacy Policy. If you do not agree with this Policy, please do not use the Service.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">2. Definitions</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300 mt-3">
                <li><strong>Personal Data</strong>: Any information relating to an identified or identifiable natural person ("Data Subject"); an identifiable natural person is one who can be identified, directly or indirectly, in particular by reference to an identifier such as a name, an identification number, location data, an online identifier or to one or more factors specific to the physical, physiological, genetic, mental, economic, cultural or social identity of that natural person. For users of our Service, this primarily includes your email address and any personal information contained within the User Content you provide.</li>
                <li><strong>Processing</strong>: Any operation or set of operations which is performed on Personal Data or on sets of Personal Data, whether or not by automated means, such as collection, recording, organization, structuring, storage, adaptation or alteration, retrieval, consultation, use, disclosure by transmission, dissemination or otherwise making available, alignment or combination, restriction, erasure or destruction.</li>
                <li><strong>Data Controller</strong>: The natural or legal person, public authority, agency or other body which, alone or jointly with others, determines the purposes and means of the Processing of Personal Data. For the purpose of this Policy, Devosmic is the Data Controller for the limited Personal Data it directly collects (e.g., email for login).</li>
                <li><strong>Data Processor</strong>: A natural or legal person, public authority, agency or other body which processes Personal Data on behalf of the Controller. Third-Party Services integrated with COSMOS may act as Data Processors or independent Data Controllers for the data they process, as outlined in Section 6.</li>
                <li><strong>User Content</strong>: Any data, information, documents (e.g., PDFs), URLs, YouTube links, email content, queries, or other materials that you upload, submit, provide, or make accessible to the Service for processing.</li>
                <li><strong>Third-Party Services</strong>: Services not operated by Devosmic but integrated into or used by COSMOS to provide its functionality, such as AI model providers, and email service providers.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">3. Data We Collect</h2>
              <p className="mt-3">We collect information about you in the following ways, to provide and improve our Service:</p>
              
              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">3.1. Information You Provide Directly to Us:</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li><strong>Account Information:</strong> When you register for or access COSMOS, particularly during our beta phase using an invite code, we collect your email address. This is used for authentication, communication, and account management purposes.</li>
                <li><strong>User Content:</strong>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>For the <strong>RAG Chatbot and YouTube Processor:</strong> You may provide files (such as PDFs), web URLs, and YouTube video URLs. COSMOS processes this content to extract text, generate embeddings, and make it searchable and interactive for you. Queries you make regarding this content are also processed.</li>
                    <li>For the <strong>Gmail Response Assistant (when you choose to use it):</strong> With your explicit authorization via Google OAuth 2.0, COSMOS will access specific data from your Gmail account based on your instructions. This may include email content (bodies, attachments to the extent necessary for analysis), metadata (sender, recipient, subject, date), and your queries related to your emails, for the purpose of classification, summarization, and drafting replies. COSMOS does not store your Gmail password.</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">3.2. Information Collected Automatically:</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li><strong>Log Data and Usage Information:</strong> Like most web services, we may automatically collect certain information when you use the Service. This may include your Internet Protocol (IP) address (primarily for security, abuse prevention, and regional service provision), browser type, operating system, access times, pages viewed, and the referring URL. This data is used for operating the Service, maintaining security, and for analytical purposes to improve the Service.</li>
                <li><strong>Cookies and Similar Tracking Technologies:</strong> We use essential cookies to operate and secure our Service. Please see Section 5 ("Cookies and Tracking Technologies") for more details.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">3.3. Information We Do Not Intentionally Collect:</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>Other than your email address for login and the content you explicitly provide for processing, <strong>COSMOS does not store other direct personal identifiers about you as part of its core design.</strong> The queries and content you submit are passed to Third-Party Services for processing as described below.</li>
                <li><strong>Sensitive Personal Information:</strong> We do not intentionally collect sensitive Personal Data (e.g., health information, racial or ethnic origin, political opinions, religious beliefs) unless it is contained within the User Content you voluntarily submit for processing. You are responsible for the User Content you provide.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">4. How We Use Your Data (Purposes and Legal Bases for Processing)</h2>
              <p className="mt-3">We use your Personal Data for the following purposes, relying on the specified legal bases under data protection laws like the GDPR:</p>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">4.1. To Provide, Operate, and Maintain the Service:</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li><strong>Purpose:</strong> Authenticate your access, process your User Content as directed by you (e.g., make documents queryable, process YouTube videos, assist with Gmail tasks), and deliver the functionalities of COSMOS.</li>
                <li><strong>Types of Data:</strong> Account Information, User Content, Gmail Data (with consent), Log Data.</li>
                <li><strong>Legal Basis (GDPR):</strong> Performance of a contract (Article 6(1)(b) GDPR) – to fulfill our <Link to="/terms" className="text-purple-400 hover:text-purple-300 underline"><strong>Terms of Service</strong></Link> with you. For Gmail Data, explicit consent (Article 6(1)(a) GDPR) for accessing and processing specific email information.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">4.2. To Communicate With You:</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li><strong>Purpose:</strong> To send you service-related notifications, updates about the Service (including changes to our terms or policies), respond to your support requests, and inform you about your account.</li>
                <li><strong>Types of Data:</strong> Account Information (Email Address).</li>
                <li><strong>Legal Basis (GDPR):</strong> Performance of a contract (Article 6(1)(b) GDPR); Legitimate interests (Article 6(1)(f) GDPR) – to keep you informed and supported.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">4.3. For Security, Fraud Prevention, and Compliance:</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li><strong>Purpose:</strong> To protect the security and integrity of our Service, prevent fraudulent activities, enforce our <Link to="/terms" className="text-purple-400 hover:text-purple-300 underline"><strong>Terms of Service</strong></Link>, and comply with applicable legal obligations, legal processes, or governmental requests.</li>
                <li><strong>Types of Data:</strong> Account Information, Log Data, IP addresses.</li>
                <li><strong>Legal Basis (GDPR):</strong> Legitimate interests (Article 6(1)(f) GDPR) – to protect our Service and users; Compliance with a legal obligation (Article 6(1)(c) GDPR).</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">4.4. To Improve and Develop the Service:</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li><strong>Purpose:</strong> To understand how users interact with COSMOS, identify areas for improvement, develop new features, and enhance the user experience. This is typically done using aggregated and anonymized data.</li>
                <li><strong>Types of Data:</strong> Anonymized or aggregated Log Data and usage patterns.</li>
                <li><strong>Legal Basis (GDPR):</strong> Legitimate interests (Article 6(1)(f) GDPR) – to enhance and develop our Service.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">5. Cookies and Tracking Technologies</h2>
              <p className="mt-3">COSMOS uses cookies and similar technologies to provide and secure our Service. Cookies are small text files stored on your device when you visit a website.</p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-gray-300">
                <li><strong>Essential Cookies:</strong> These are necessary for the Service to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms (e.g., CSRF protection cookies, session cookies for authentication). You can set your browser to block or alert you about these cookies, but some parts of the Service will not then work. These cookies do not store any personally identifiable information directly.</li>
                <li><strong>Analytics and Performance Cookies (If Used):</strong> We may in the future use cookies to collect information about how you use our Service, such as which pages you visit and if you experience any errors. These cookies help us improve how our Service works. Where these are not strictly essential, we will seek your consent.</li>
                <li><strong>Third-Party Cookies:</strong> Some Third-Party Services we integrate with (e.g., Google for OAuth) may set their own cookies when you interact with their functionalities through COSMOS. We do not control these cookies. Please refer to the privacy policies of these third parties.</li>
              </ul>
              <p className="mt-3">You can manage your cookie preferences through your browser settings.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">6. Data Sharing and Disclosure</h2>
              <p className="mt-3">COSMOS is designed to leverage specialized Third-Party Services to provide its core AI functionalities. <strong className="text-violet-400">We do not sell your Personal Data.</strong> We share your information only in the limited circumstances described below:</p>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">6.1. With Third-Party Service Providers (Data Processors or Independent Controllers):</h3>
              <p className="mt-3">To provide its features, COSMOS transmits User Content and queries to Third-Party Services. These services process your data to perform tasks on our (and your) behalf.</p>
              <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-300">
                <li><strong>AI Model Providers:</strong> When you use the RAG Chatbot or the Gmail Response Assistant, your queries and relevant User Content (or Gmail Data) are sent to these providers to generate responses, embeddings, classifications, or summaries. These providers may act as Data Processors or independent Controllers depending on their terms.</li>
                <li><strong>Vector Database Provider:</strong> To enable the RAG Chatbot, processed and embedded representations of your User Content (from PDFs, URLs, YouTube) are stored in a Pinecone vector database. Pinecone acts as a Data Processor for this stored data.</li>
                <li><strong>Google (Gmail API):</strong> If you authorize the Gmail Response Assistant, COSMOS interacts with the Gmail API to fetch, analyze, and send emails on your behalf. Google processes your Gmail data according to its own privacy policy when you use its services.</li>
                <li><strong>Data Extraction Services:</strong> When you provide a URL, these tools may be used to fetch the content, which is then processed by COSMOS.</li>
                <li><strong>Hosting and Infrastructure Providers:</strong> We use third-party providers for hosting our application, databases (including the authentication database storing your email), and other infrastructure.</li>
              </ul>
              <p className="mt-3">We select these Third-Party Services carefully and, where they act as Data Processors, enter into agreements that require them to protect Personal Data. However, when your data is passed to these services (especially AI model providers for query processing), they may process it according to their own privacy policies and terms. We encourage you to review the privacy policies of these Third-Party Services. <strong>You acknowledge that by using COSMOS, your User Content and queries will be processed by these Third-Party Services as an integral part of the Service's functionality.</strong></p>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">6.2. For Legal Reasons:</h3>
              <p className="mt-3">We may disclose your Personal Data if we believe in good faith that such disclosure is necessary to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-300">
                <li>Comply with a legal obligation, subpoena, court order, or other governmental request.</li>
                <li>Protect and defend the rights, property, or safety of Devosmic, COSMOS, our users, or the public.</li>
                <li>Prevent or investigate possible wrongdoing in connection with the Service.</li>
                <li>Enforce our <Link to="/terms" className="text-purple-400 hover:text-purple-300 underline"><strong>Terms of Service</strong></Link> or other agreements.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">6.3. Business Transfers:</h3>
              <p className="mt-3">In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your Personal Data may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our Service of any change in ownership or uses of your Personal Data, as well as any choices you may have regarding your Personal Data.</p>

              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-200">6.4. With Your Consent:</h3>
              <p className="mt-3">We may share your Personal Data for other purposes with your explicit consent.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">7. Data Retention and Deletion</h2>
              <p className="mt-3">We retain Personal Data for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements, and to operate and provide the Service.</p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-gray-300">
                <li><strong>Account Information (Email Address):</strong> We retain your email address as long as your COSMOS account is active or as needed to provide you with the Service. If you close your account, we will delete your email address from our active systems, subject to any legal retention obligations or needs for backup/archival purposes for a limited period.</li>
                <li><strong>User Content Processed for RAG (in Pinecone):</strong> The embedded representations of your uploaded documents, URLs, and YouTube transcripts stored in Pinecone are maintained to provide you with the RAG chatbot functionality. You can manage (e.g., delete specific sources) this content through the Service interface if such features are available, or by requesting deletion. Upon account termination, this associated processed content in Pinecone will be scheduled for deletion.</li>
                <li><strong>Gmail Data:</strong> COSMOS does not persistently store your Gmail messages. It accesses them via Google OAuth 2.0 tokens to perform actions as you direct. You can revoke COSMOS's access to your Gmail account at any time through your Google account settings.</li>
                <li><strong>Log Data:</strong> Log data is typically retained for a limited period (90 days) for security, troubleshooting, and operational analysis, after which it is deleted or anonymized.</li>
              </ul>
              <p className="mt-3">You may request deletion of your Personal Data by contacting us as described in Section 13.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">8. Security Measures</h2>
              <p className="mt-3">Devosmic takes the security of your Personal Data seriously. We implement a variety of technical and organizational security measures designed to protect the Personal Data we process from unauthorized access, use, alteration, disclosure, or destruction. These measures include:</p>
              <ul className="list-disc pl-5 space-y-1 mt-3 text-gray-300">
                <li>Encryption of data in transit (e.g., HTTPS/TLS).</li>
                <li>Secure authentication mechanisms and CSRF protection.</li>
                <li>Access controls to limit access to Personal Data to authorized personnel.</li>
                <li>Regular review of our security practices.</li>
                <li>Use of reputable Third-Party Service providers with their own robust security practices.</li>
              </ul>
              <p className="mt-3">However, please be aware that no security system is impenetrable. We cannot guarantee the absolute security of your Personal Data, especially data transmitted to or from the Service over the Internet or data processed by Third-Party Services. You are responsible for maintaining the security of your account credentials.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">9. Your Rights (Under GDPR and other applicable laws)</h2>
              <p className="mt-3">Depending on your location and applicable data protection laws (such as GDPR for individuals in the European Economic Area), you may have the following rights regarding your Personal Data:</p>
              <ul className="list-disc pl-5 space-y-2 mt-3 text-gray-300">
                <li><strong>Right of Access:</strong> To request information about the Personal Data we hold about you and to obtain a copy.</li>
                <li><strong>Right to Rectification:</strong> To request correction of inaccurate Personal Data.</li>
                <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> To request deletion of your PersonalData under certain conditions (e.g., if it's no longer necessary for the purposes collected, or you withdraw consent).</li>
                <li><strong>Right to Restriction of Processing:</strong> To request that we limit the processing of your Personal Data under certain conditions.</li>
                <li><strong>Right to Data Portability:</strong> To receive your Personal Data in a structured, commonly used, and machine-readable format and to transmit it to another controller, where technically feasible.</li>
                <li><strong>Right to Object:</strong> To object to the processing of your Personal Data based on our legitimate interests, under certain conditions.</li>
                <li><strong>Right to Withdraw Consent:</strong> Where we rely on your consent to process Personal Data (e.g., for accessing Gmail), you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing based on consent before its withdrawal.</li>
                <li><strong>Right to Lodge a Complaint:</strong> To lodge a complaint with a supervisory authority if you believe our processing of your Personal Data infringes applicable data protection laws.</li>
              </ul>
              <p className="mt-3">To exercise these rights, please contact us using the details in Section 13. We will respond to your request in accordance with applicable law. We may need to verify your identity before processing your request.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">10. International Data Transfers</h2>
              <p className="mt-3">Devosmic and its Third-Party Service providers may operate in various countries around the world. Therefore, your Personal Data may be transferred to, stored, and processed in countries other than your country of residence, including the United States, which may have data protection laws that are different from the laws of your country.</p>
              <p className="mt-3">Where we transfer Personal Data outside of jurisdictions like the European Economic Area (EEA) or the UK, we will ensure that appropriate safeguards are in place to protect the data, such as by using Standard Contractual Clauses (SCCs) approved by the European Commission, relying on adequacy decisions, or other lawful transfer mechanisms. By using the Service, you consent to such transfers, provided that appropriate safeguards are in place.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">11. Children's Privacy</h2>
              <p className="mt-3">COSMOS is not directed to individuals under the age of <strong className="text-violet-400">16</strong>. We do not knowingly collect Personal Data from children. If we become aware that we have inadvertently collected Personal Data from a child without verifiable parental consent, we will take steps to delete such information from our records promptly. If you believe we might have any information from or about a child, please contact us.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">12. Updates to This Privacy Policy</h2>
              <p className="mt-3">We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. If we make material changes, we will notify you by email (sent to the email address specified in your account), by posting a notice on our Service prior to the change becoming effective, or as otherwise required by law. We encourage you to review this Policy periodically for the latest information on our privacy practices. Your continued use of the Service after any changes to this Privacy Policy will constitute your acceptance of such changes.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">13. Contact Information</h2>
              <p className="mt-3">If you have any questions, concerns, or complaints about this Privacy Policy or our data handling practices, or if you wish to exercise your rights, please contact Devosmic at:</p>
              <ul className="list-none pl-0 space-y-1 mt-3 text-gray-300">
                <li><strong>Devosmic</strong></li>
                <li>Email: <a href="mailto:privacy@devosmic.com" className="text-purple-400 hover:text-purple-300 underline"><strong className="text-violet-400">privacy@devosmic.com</strong></a></li>
              </ul>
              <p className="mt-3">We will endeavor to address your concerns promptly and appropriately.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">Last Updated</h2>
              <p className="mt-3">This Privacy Policy was last updated on <strong className="text-violet-400">May 18th, 2025</strong>.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 