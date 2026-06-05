import streamlit as st

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

    /* Layout halaman */
    .block-container {
        padding-top: 0vh !important;
        padding-bottom: 5vh !important;
    }

    /* Warna teks */
    h1, p, span, label, h3 {
        color: #F8FAFC !important;
    }

    /* Card form */
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

    /* Tombol submit */
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

    /* Tombol kembali */
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
</style>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns([1, 2.5, 1])

with col2:
    st.markdown(
        "<h1 style='text-align: center; margin-bottom: -10px;'>SnapFlow</h1>",
        unsafe_allow_html=True
    )

    st.markdown(
        "<p style='text-align: center; color: #94A3B8 !important; font-size: 15px; margin-bottom: 25px;'>Buat akun baru untuk AI Workplace Assistant-mu</p>",
        unsafe_allow_html=True
    )

    with st.form("register_form"):
        st.markdown("""
        <h3 style='margin-top: 0; display: flex; align-items: center; padding-bottom: 5px; color: #F8FAFC;'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                 style="width: 24px; height: 24px; margin-right: 8px;">
                <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
            </svg>
            Daftar Akun
        </h3>
        """, unsafe_allow_html=True)

        new_user = st.text_input(
            "Username",
            placeholder="Pilih username..."
        )

        new_email = st.text_input(
            "Email",
            placeholder="Masukkan email aktif..."
        )

        new_pass = st.text_input(
            "Password",
            type="password",
            placeholder="Minimal 8 karakter"
        )

        confirm_pass = st.text_input(
            "Konfirmasi Password",
            type="password",
            placeholder="Ulangi password"
        )

        submit_register = st.form_submit_button(
            "Daftar Sekarang",
            use_container_width=True
        )

        if submit_register:
            if not new_user or not new_email or not new_pass or not confirm_pass:
                st.warning("⚠️ Semua kolom wajib diisi!")
            elif new_pass != confirm_pass:
                st.error("❌ Konfirmasi password tidak cocok!")
            else:
                st.success("✅ Akun berhasil dibuat! Silakan kembali ke halaman Login.")

    st.write("")

    st.markdown(
        "<p style='text-align: center; font-size: 14px; margin-bottom: 5px; color: #94A3B8 !important;'>Sudah punya akun?</p>",
        unsafe_allow_html=True
    )

    if st.button("Kembali ke Login", use_container_width=True):
        st.switch_page("pages/login.py")