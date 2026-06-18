import streamlit as st

# Konfigurasi halaman utama
st.set_page_config(
    page_title="SnapFlow - AI Assistant",
    page_icon="🤖",
    initial_sidebar_state="expanded" 
)

# Inisialisasi state login
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

# Mengarahkan pengguna ke halaman yang sesuai berdasarkan status login
if st.session_state['logged_in']:
    st.switch_page("pages/01_Dashboard.py")
else:
    st.switch_page("pages/login.py")