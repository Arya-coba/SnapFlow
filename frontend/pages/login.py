import streamlit as st

# Inisialisasi status login
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

st.markdown("""
<style>
    /* Sembunyikan elemen bawaan Streamlit */
    [data-testid="collapsedControl"] {display: none;}
    [data-testid="stSidebar"] {display: none;}
    [data-testid="stHeader"] {display: none;}

    /* Background utama */
    .stApp {
        background-color: #0F172A !important;
    }

    /* Warna teks */
    h1, p, span, label, h3 {
        color: #F8FAFC !important;
    }

    /* Card form login */
    [data-testid="stForm"] {
        width: 100% !important;
        background-color: #1E293B !important;
        border-radius: 12px !important;
        border: 1px solid #334155 !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
        padding: 2rem !important;
    }

    /* Input */
    [data-testid="stTextInput"] input {
        background-color: #0F172A !important;
        border: 1px solid #475569 !important;
        color: #FFFFFF !important;
        border-radius: 8px !important;
    }

    [data-testid="stTextInput"] input:focus {
        border-color: #10B981 !important;
        box-shadow: 0 0 0 1px #10B981 !important;
    }

    /* Tombol login */
    [data-testid="stFormSubmitButton"] {
        width: 100% !important;
        margin-top: 10px;
    }

    [data-testid="stFormSubmitButton"] button {
        width: 100% !important;
        background-color: #10B981 !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: bold !important;
        padding: 0.5rem !important;
    }

    [data-testid="stFormSubmitButton"] button:hover {
        background-color: #059669 !important;
    }

    /* Tombol daftar */
    .stButton > button {
        background-color: transparent !important;
        border: 1px solid #475569 !important;
        color: #94A3B8 !important;
        border-radius: 8px !important;
    }

    .stButton > button:hover {
        border-color: #F8FAFC !important;
        color: #F8FAFC !important;
    }

    /* Atur jarak atas halaman */
    .block-container {
        padding-top: 3rem !important;
    }
</style>
""", unsafe_allow_html=True)

# Redirect jika sudah login
if st.session_state['logged_in']:
    st.switch_page("pages/01_Dashboard.py")

else:
    col1, col2, col3 = st.columns([1, 1.8, 1])

    with col2:
        st.markdown(
            "<h1 style='text-align: center; margin-bottom: -15px;'>SnapFlow</h1>",
            unsafe_allow_html=True
        )

        st.markdown(
            "<p style='text-align: center; color: #94A3B8 !important; font-size: 15px; margin-bottom: 25px;'>Sign in to your AI Workplace Assistant</p>",
            unsafe_allow_html=True
        )

        with st.form("login_form"):
            st.markdown("""
            <h3 style='margin-top: 0; display: flex; align-items: center; padding-bottom: 5px; color: #F8FAFC;'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                     style="width: 24px; height: 24px; margin-right: 8px;">
                    <path fill-rule="evenodd"
                          d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                          clip-rule="evenodd" />
                </svg>
                Masuk
            </h3>
            """, unsafe_allow_html=True)

            username = st.text_input(
                "Username",
                placeholder="Masukkan username..."
            )

            password = st.text_input(
                "Password",
                type="password",
                placeholder="••••••••"
            )

            submit_login = st.form_submit_button(
                "Masuk Sekarang",
                use_container_width=True
            )

            if submit_login:
                if username == "admin" and password == "1234":
                    st.session_state['logged_in'] = True
                    st.success("Login berhasil!")
                    st.rerun()
                else:
                    st.error("Username atau password salah!")

        st.write("")

        st.markdown(
            "<p style='text-align: center; font-size: 14px; margin-bottom: 5px; color: #94A3B8 !important;'>Belum punya akun?</p>",
            unsafe_allow_html=True
        )

        if st.button("Daftar di sini", use_container_width=True):
            st.switch_page("pages/register.py")