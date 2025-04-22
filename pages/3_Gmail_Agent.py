import streamlit as st
import os
import time
import base64
import json
from datetime import datetime
from dotenv import load_dotenv
from core.agents.gmail_logic import (
    gmail_authenticate,
    get_gmail_service,
    save_credentials,
    get_emails,
    classify_email,
    generate_reply,
    send_email,
    summarize_email,
    modify_email_labels,
    TOKEN_FILE
)
load_dotenv()

# App configuration
st.set_page_config(
    page_title="Gmail Response Assistant",
    page_icon="📧",
    layout="wide"
)

st.title("📧 Gmail Response Assistant")
st.write("Automate email responses with customized AI-generated replies")

# Sidebar authentication
with st.sidebar:
    st.header("Authentication")
    
    # Check for credentials file
    CREDENTIALS_FILE_UI_CHECK = 'credentials/.gmail_credentials.json'
    if not os.path.exists(CREDENTIALS_FILE_UI_CHECK):
        st.error("Gmail API credentials file not found. Please upload your credentials.json file.")
        uploaded_file = st.file_uploader("Upload your credentials.json file", type=['json'])
        if uploaded_file is not None:
            if save_credentials(uploaded_file):
                st.success("Credentials file uploaded successfully!")
                st.cache_resource.clear()
                st.rerun()
            else:
                st.error("Failed to save credentials file.")
    
    # Authentication status
    service = get_gmail_service()
    if service:
        st.success("✅ Connected to Gmail")
        
        # Logout option
        if st.button("Logout from Gmail"):
            if os.path.exists(TOKEN_FILE):
                try:
                    os.remove(TOKEN_FILE)
                    st.cache_resource.clear()
                    st.success("Logged out successfully!")
                    st.rerun()
                except OSError as e:
                    st.error(f"Error removing token file: {e}")
            else:
                 st.info("Already logged out (token file not found).")
                 st.cache_resource.clear()
                 st.rerun()
    else:
        st.warning("⚠️ Not connected to Gmail")
        st.info("Please authenticate to access your Gmail account")
        
        if st.button("Connect to Gmail"):
            with st.spinner("Attempting to authenticate..."):
                st.cache_resource.clear()
                new_service = get_gmail_service()
                if new_service:
                    st.success("Authentication successful!")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error("Authentication failed. Check terminal/logs if needed.")
    
    st.markdown("---")
    
    # Email search settings
    st.header("Email Settings")
    email_query = st.text_input("Search Query", value="is:unread", 
                               help="Gmail search query (e.g., is:unread, from:example@gmail.com)")
    max_results = st.slider("Max Emails to Load", min_value=1, max_value=50, value=10)
    
    if st.button("Fetch Emails"):
        if service:
            with st.spinner("Fetching emails..."):
                st.session_state['emails'] = get_emails(service, max_results=max_results, query=email_query or None)
            st.session_state['selected_email_id'] = None
            st.session_state['generated_reply'] = ""
            st.session_state['email_summary'] = ""
            st.rerun()
        else:
            st.warning("Please connect to Gmail first.")

# Email listing and processing
if 'emails' in st.session_state and st.session_state['emails']:
    emails = st.session_state['emails']
    
    # Email selection sidebar
    email_options = {f"{email['subject']} (From: {email['from']})": email['id'] for email in emails}
    selected_email_key = st.sidebar.selectbox("Select Email to Process", options=list(email_options.keys()))
    
    if selected_email_key:
        selected_id_candidate = email_options.get(selected_email_key)
        if selected_id_candidate != st.session_state.get('selected_email_id'):
            st.session_state['selected_email_id'] = selected_id_candidate
            st.session_state['generated_reply'] = ""
            st.session_state['email_summary'] = ""

    # Email details and actions
    selected_id = st.session_state.get('selected_email_id')
    if selected_id:
        selected_email = next((email for email in emails if email['id'] == selected_id), None)
        
        if selected_email:
            st.subheader(f"Subject: {selected_email['subject']}")
            st.caption(f"From: {selected_email['from']} | To: {selected_email['to']} | Date: {selected_email['date']}")
            
            with st.expander("View Full Email Body", expanded=False):
                st.text(selected_email['body'])
                
            # Email analysis actions
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("Classify Email"):
                    with st.spinner("Classifying..."):
                        category = classify_email(selected_email['body'], selected_email['subject'])
                    st.info(f"Email classified as: **{category}**")
            
            with col2:
                 if st.button("Summarize Email"):
                    with st.spinner("Generating summary..."):
                        summary = summarize_email(selected_email['body'])
                    st.session_state['email_summary'] = summary

            # Display summary if available
            if st.session_state.get('email_summary'):
                st.subheader("Email Summary")
                st.markdown(st.session_state['email_summary'])
                
            st.divider()
            st.subheader("Generate Reply")
            
            # Reply configuration options
            reply_col1, reply_col2, reply_col3 = st.columns(3)
            with reply_col1:
                tone = st.selectbox("Tone", ["Friendly", "Formal", "Direct", "Empathetic"], index=0)
            with reply_col2:
                style = st.selectbox("Style", ["Concise", "Detailed", "Professional", "Casual"], index=0)
            with reply_col3:
                length = st.selectbox("Length", ["Brief", "Standard", "Comprehensive"], index=1)

            # Context for reply generation
            user_context_input = st.text_area(
                "Optional Context for Reply:", 
                placeholder="e.g., I had a fever; Please reschedule the meeting; Ask for clarification on point 3.",
                help="Provide brief context, keywords, or sentences to guide the reply generation. Leave blank if not needed."
            )
            
            if st.button("Generate Draft Reply"):
                with st.spinner("Generating draft reply..."):
                    generated_reply = generate_reply(
                        selected_email['body'],
                        selected_email['subject'],
                        selected_email['from'],
                        tone, 
                        style, 
                        length,
                        user_context=user_context_input
                    )
                st.session_state['generated_reply'] = generated_reply
            
            # Edit and send reply
            if 'generated_reply' in st.session_state and st.session_state['generated_reply']:
                edited_reply = st.text_area("Edit Reply:", value=st.session_state['generated_reply'], height=250)
                
                if st.button("Send Reply"):
                    if service:
                        reply_subject = selected_email['subject']
                        if not reply_subject.lower().startswith("re:"):
                            reply_subject = "Re: " + reply_subject
                        
                        send_status = send_email(
                            service, 
                            selected_email['from'],
                            reply_subject,
                            edited_reply,
                            thread_id=selected_email['thread_id'],
                            original_message_id=selected_email['id']
                        )
                        
                        if send_status:
                            st.success(f"Reply sent successfully to {selected_email['from']}!")
                            modify_success = modify_email_labels(service, selected_id, labels_to_remove=['UNREAD'])
                            if modify_success:
                                st.info("Marked email as read.")
                            else:
                                st.warning(f"Could not mark email as read.")
                                
                            st.session_state['generated_reply'] = ""
                            st.session_state['email_summary'] = ""
                            st.session_state['selected_email_id'] = None
                            st.session_state['emails'] = None
                            st.rerun()
                        else:
                            st.error("Failed to send the reply.")
                    else:
                        st.error("Authentication error. Cannot send email.")
            
# No emails message
elif 'emails' in st.session_state and not st.session_state['emails']:
    st.info("No emails found matching your query or no unread emails.")

# Footer
st.divider()
st.caption("Gmail Response Assistant • Powered by OpenAI GPT • Built with Streamlit")