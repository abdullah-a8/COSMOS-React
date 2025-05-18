import React, { useEffect } from 'react';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import Header from '../landing-page/Header';
import Footer from '../landing-page/Footer';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
              Terms of Service
            </h1>
            
            <div className="prose prose-invert prose-purple max-w-none">
              <p className="text-gray-300"><strong>Effective Date:</strong> May 18th, 2025</p>

              <p className="text-gray-300 mt-4">Welcome to <strong>COSMOS</strong> ("us," "we," "our," or "the Service"). COSMOS is a Collaborative Organized System for Multiple Operating Specialists, an integrated AI assistant platform. These <strong>Terms of Service</strong> ("Terms") govern your access to and use of the COSMOS application, including any content, functionality, and services offered on or through COSMOS (collectively, the "Service").</p>

              <p className="text-gray-300 mt-4">Please read these Terms carefully before you start to use the Service. By using the Service, or by clicking to accept or agree to the Terms when this option is made available to you, you accept and agree to be bound and abide by these Terms and our <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy</strong></Link>, incorporated herein by reference. If you do not want to agree to these Terms or the <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy</strong></Link>, you must not access or use the Service.</p>

              <p className="text-gray-300 mt-4">This Service is offered and available to users who are <strong>18 years of age or older</strong>. By using this Service, you represent and warrant that you are of legal age to form a binding contract with us.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">1. Definitions</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li><strong>"Service"</strong> refers to the COSMOS platform, including its RAG Chatbot, YouTube Processor, Gmail Response Assistant, and any other features, tools, or functionalities offered.</li>
                <li><strong>"User," "You," "Your"</strong> refers to the individual accessing or using the Service.</li>
                <li><strong>"User Content"</strong> means any data, information, documents (e.g., PDFs), URLs, YouTube links, email content, queries, or other materials that you upload, submit, provide, or make accessible to the Service.</li>
                <li><strong>"Third-Party Services"</strong> refers to services not operated by us but integrated into or used by COSMOS, such as Google, OpenAI, Groq, Pinecone, and others used for data extraction.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">2. Access to the Service</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Beta Service:</strong> You acknowledge that COSMOS is currently offered as a beta service and may contain bugs, errors, and omissions. The Service is provided <strong className="text-violet-400">"AS IS"</strong> and <strong className="text-violet-400">"AS AVAILABLE"</strong> without any warranties. We reserve the right to modify, suspend, or discontinue the Service, or any part thereof, with or without notice, at any time.</li>
                <li><strong>Invite Codes:</strong> Access to the Service is currently managed through an invite code system. Invite codes are personal, non-transferable, and may be subject to expiration dates or usage limits as communicated at the time of issuance. You agree not to share your invite code with unauthorized individuals. We reserve the right to revoke invite codes or deny access at our discretion.</li>
                <li><strong>Account Registration:</strong> To access certain features, you may need to register for an account or authenticate via Third-Party Services (e.g., Google OAuth for the Gmail Response Assistant). You agree to provide accurate, current, and complete information during the registration/authentication process and to update such information to keep it accurate, current, and complete.</li>
                <li><strong>Account Security:</strong> You are responsible for safeguarding your account credentials (including invite codes and any passwords) and for any activities or actions under your account. You agree to notify us immediately of any unauthorized use of your account.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">3. Use of the Service</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>License to Use the Service:</strong> Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service for your personal or internal business purposes.</li>
                <li><strong>Permitted Use:</strong> You agree to use the Service only for lawful purposes and in accordance with these Terms. You are responsible for all User Content you provide and your interactions with the Service.</li>
                <li><strong>Specific Agent Terms:</strong>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>RAG Chatbot & YouTube Processor: When you provide documents, URLs, or YouTube links, you authorize COSMOS to process this content, extract information, generate embeddings, and store this processed data in our vector database (Pinecone) to enable the chat functionality. You are responsible for ensuring you have the necessary rights to provide this content for processing.</li>
                    <li>Gmail Response Assistant: By using the Gmail Response Assistant, you authorize COSMOS to access your Gmail account via Google OAuth 2.0. This access will be used to fetch emails based on your queries, analyze email content (for classification, summarization), draft replies using AI, and send emails on your behalf as directed by you. COSMOS will interact with the OpenAI API for these AI-driven email processing tasks. You are solely responsible for the content of emails sent through the Service.</li>
                  </ul>
                </li>
                <li><strong>Prohibited Uses:</strong> You agree not to:
                  <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-400">
                    <li>Use the Service in any way that violates any applicable federal, state, local, or international law or regulation.</li>
                    <li>Upload, transmit, or process any User Content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of another\'s privacy, hateful, or racially, ethnically, or otherwise objectionable.</li>
                    <li>Infringe upon or violate our intellectual property rights or the intellectual property rights of others.</li>
                    <li>Attempt to decompile, reverse engineer, disassemble, or otherwise derive the source code of the Service, except as permitted by applicable law or the MIT License under which parts of the software may be available.</li>
                    <li>Use any robot, spider, or other automatic device, process, or means to access the Service for any purpose, including monitoring or copying any of the material on the Service, without our prior written consent.</li>
                    <li>Introduce any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful.</li>
                    <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service, the server on which the Service is stored, or any server, computer, or database connected to the Service.</li>
                    <li>Interfere with the proper working of the Service or take any action that imposes an unreasonable or disproportionately large load on our infrastructure.</li>
                    <li>Use the Service to develop a competing product or service.</li>
                  </ul>
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">4. User Content</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Ownership:</strong> You retain all ownership rights to your User Content. We do not claim any ownership rights over your User Content.</li>
                <li><strong>License to Us:</strong> By providing User Content to the Service, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, process, adapt, modify, publish, transmit, display, and distribute such User Content solely for the purpose of operating, providing, improving, and developing the Service. This license includes the right for us to:
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Store User Content on our servers and those of our Third-Party Service providers.</li>
                    <li>Process User Content using AI models to provide the features of the Service.</li>
                    <li>Transmit User Content as necessary to provide the Service (e.g., sending emails via Gmail API).</li>
                  </ul>
                </li>
                <li><strong>Responsibility for User Content:</strong> You are solely responsible for your User Content and the consequences of submitting and processing it through the Service. You represent and warrant that:
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>You own or have the necessary licenses, rights, consents, and permissions to use and authorize us to use your User Content in the manner contemplated by the Service and these Terms.</li>
                    <li>Your User Content does not and will not infringe, misappropriate, or violate any third party\'s intellectual property rights, rights of publicity or privacy, or any other proprietary rights, or result in the violation of any applicable law or regulation.</li>
                  </ul>
                </li>
                <li><strong>Data Accuracy:</strong> The Service relies on the information you provide. You are responsible for the accuracy and completeness of User Content.</li>
                <li><strong>Content Removal:</strong> We reserve the right, but are not obligated, to review, screen, or remove User Content at our sole discretion and without notice if it violates these Terms or is otherwise objectionable.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">5. Third-Party Services and Links</h2>
               <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Third-Party Services:</strong> The Service integrates with and relies on Third-Party Services (e.g., Google, OpenAI, Groq, Pinecone). Your use of these Third-Party Services is subject to their respective terms and conditions and privacy policies. We are not responsible for the operation, content, or practices of Third-Party Services. You acknowledge that the availability of the Service, or certain features, may depend on these Third-Party Services, and we are not liable for any issues arising from them.</li>
                <li><strong>External Links:</strong> The Service may contain links to third-party websites or resources. We provide these links only as a convenience and are not responsible for the content, products, or services on or available from those websites or resources.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">6. Intellectual Property Rights</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Our Intellectual Property:</strong> The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of COSMOS and its licensors. The Service is protected by copyright, trademark, and other laws of the State of California and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent. The underlying software for COSMOS, in part, is made available under the MIT License. These Terms of Service govern your use of the deployed Service, not necessarily the source code itself if obtained separately.</li>
                <li><strong>Feedback:</strong> If you provide us with any feedback, suggestions, or ideas regarding the Service ("Feedback"), you hereby grant us a perpetual, irrevocable, worldwide, royalty-free, fully paid-up license to use, modify, incorporate into the Service, and otherwise exploit such Feedback for any purpose, without any obligation or compensation to you.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">7. Privacy</h2>
              <p className="text-gray-300">Your privacy is important to us. Our <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy</strong></Link>, which is incorporated by reference into these Terms, explains how we collect, use, and disclose information about you. You can review the full <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy here</strong></Link>. By using the Service, you consent to all actions taken by us with respect to your information in compliance with the <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy</strong></Link>.</p>
              <p className="text-gray-300 mt-3">Specifically for the Gmail Response Assistant, you acknowledge that by authorizing access to your Gmail account, COSMOS will process email content as described in these Terms and the <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy</strong></Link>.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">8. Term and Termination</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Term:</strong> These Terms commence on the date you first accept them and will remain in full force and effect while you use the Service, unless terminated earlier in accordance with these Terms.</li>
                <li><strong>Termination by You:</strong> You may terminate these Terms at any time by ceasing all use of the Service and, if applicable, deleting your account.</li>
                <li><strong>Termination by Us:</strong> We may suspend or terminate your access to and use of the Service, at our sole discretion, at any time and without notice to you, for any reason or no reason, including but not limited to, if you breach these Terms or if your invite code expires or is revoked.</li>
                <li><strong>Effect of Termination:</strong> Upon termination, all rights and licenses granted to you under these Terms will immediately cease. We will have no obligation to maintain or provide your User Content and may thereafter delete or destroy all copies of your User Content in our possession or control, unless legally prohibited. <strong className="text-violet-400">Sections 4 (User Content - specifically the license you grant us for content already processed, for the purpose of our internal improvement if anonymized, subject to privacy policy), 6 (Intellectual Property Rights), 9 (Disclaimers), 10 (Limitation of Liability), 11 (Indemnification), 12 (Governing Law and Dispute Resolution), and 13 (General Provisions)</strong> will survive termination.</li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">9. Disclaimers</h2>
              <p className="text-gray-300 font-semibold uppercase">THE SERVICE IS PROVIDED ON AN <strong className="text-violet-400">"AS IS"</strong> AND <strong className="text-violet-400">"AS AVAILABLE"</strong> BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE.</p>
              <p className="text-gray-300 mt-3 font-semibold uppercase">WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THAT THE RESULTS OBTAINED FROM THE USE OF THE SERVICE WILL BE ACCURATE, RELIABLE, OR MEET YOUR EXPECTATIONS.</p>
              <p className="text-gray-300 mt-3">YOU ACKNOWLEDGE THAT THE SERVICE UTILIZES AI MODELS AND THIRD-PARTY SERVICES. THE OUTPUTS FROM AI MODELS (SUCH AS CHAT RESPONSES OR DRAFTED EMAILS) MAY CONTAIN INACCURACIES, ERRORS, OR OMISSIONS, OR MAY BE INCOMPLETE. YOU ARE SOLELY RESPONSIBLE FOR REVIEWING AND VALIDATING ANY INFORMATION OR CONTENT GENERATED BY THE SERVICE BEFORE RELYING ON IT OR USING IT.</p>
              <p className="text-gray-300 mt-3 font-semibold uppercase">WE DISCLAIM ALL LIABILITY FOR ANY HARM OR DAMAGES CAUSED BY ANY THIRD-PARTY HOSTING PROVIDERS OR OTHER THIRD-PARTY SERVICES.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">10. Limitation of Liability</h2>
              <p className="text-gray-300 font-semibold uppercase">TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL COSMOS, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICE, ANY WEBSITES LINKED TO IT, ANY CONTENT ON THE SERVICE OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.</p>
              <p className="text-gray-300 mt-3">OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS SHALL NOT EXCEED THE GREATER OF <strong className="text-violet-400">ONE HUNDRED U.S. DOLLARS ($100.00)</strong> OR THE AMOUNT YOU HAVE PAID US FOR USE OF THE SERVICE IN THE LAST SIX (6) MONTHS, IF ANY.</p>
              <p className="text-gray-300 mt-3 font-semibold uppercase">THE FOREGOING DOES NOT AFFECT ANY LIABILITY THAT CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">11. Indemnification</h2>
              <p className="text-gray-300">You agree to defend, indemnify, and hold harmless COSMOS, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys\' fees) arising out of or relating to your violation of these Terms or your use of the Service, including, but not limited to, your User Content, any use of the Service\'s content, services, and products other than as expressly authorized in these Terms, or your use of any information obtained from the Service.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">12. Governing Law and Dispute Resolution</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Governing Law:</strong> These Terms and any dispute or claim arising out of, or related to, them, their subject matter, or their formation (in each case, including non-contractual disputes or claims) shall be governed by and construed in accordance with the internal laws of the State of California without giving effect to any choice or conflict of law provision or rule.</li>
                <li><strong>Arbitration:</strong> At our sole discretion, we may require you to submit any disputes arising from these Terms or use of the Service, including disputes arising from or concerning their interpretation, violation, invalidity, non-performance, or termination, to final and binding arbitration under the Rules of Arbitration of the American Arbitration Association applying CA law. The arbitration shall take place in SF, CA.</li>
                <li><strong className="uppercase text-violet-400">Waiver of Jury Trial and Class Action:</strong> <span className="uppercase">YOU AND COSMOS WAIVE ANY CONSTITUTIONAL AND STATUTORY RIGHTS TO GO TO COURT AND HAVE A TRIAL IN FRONT OF A JUDGE OR A JURY. YOU FURTHER AGREE THAT ANY ARBITRATION SHALL BE CONDUCTED IN YOUR INDIVIDUAL CAPACITY ONLY AND NOT AS A CLASS ACTION OR OTHER REPRESENTATIVE ACTION, AND YOU EXPRESSLY WAIVE YOUR RIGHT TO FILE A CLASS ACTION OR SEEK RELIEF ON A CLASS BASIS.</span></li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">13. General Provisions</h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Entire Agreement:</strong> These Terms, together with our <Link to="/privacy-policy" className="text-purple-400 hover:text-purple-300 underline"><strong>Privacy Policy</strong></Link>, constitute the sole and entire agreement between you and COSMOS regarding the Service and supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the Service.</li>
                <li><strong>Changes to Terms:</strong> We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least <strong className="text-violet-400">30 days'</strong> notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service. It is your responsibility to review these Terms periodically for changes.</li>
                <li><strong>Waiver:</strong> No waiver by COSMOS of any term or condition set out in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of COSMOS to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.</li>
                <li><strong>Severability:</strong> If any provision of these Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.</li>
                <li><strong>Assignment:</strong> You may not assign or transfer these Terms, by operation of law or otherwise, without our prior written consent. Any attempt by you to assign or transfer these Terms, without such consent, will be null and of no effect. We may assign or transfer these Terms, at our sole discretion, without restriction. Subject to the foregoing, these Terms will bind and inure to the benefit of the parties, their successors, and permitted assigns.</li>
                <li><strong>Notices:</strong> Any notices or other communications provided by COSMOS under these Terms, including those regarding modifications to these Terms, will be given: (i) via email; or (ii) by posting to the Service. For notices made by e-mail, the date of receipt will be deemed the date on which such notice is transmitted.</li>
                <li><strong>Contact Information:</strong> All other feedback, comments, requests for technical support, and other communications relating to the Service should be directed to: <a href="mailto:contact@devosmic.com" className="text-purple-400 hover:text-purple-300 underline"><strong>contact@devosmic.com</strong></a></li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">Last Updated</h2>
              <p className="text-gray-300">This Terms of Service was last updated on <strong>May 18th, 2025</strong>.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService; 