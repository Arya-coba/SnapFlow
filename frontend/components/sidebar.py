import streamlit as st


def show_sidebar():

    # Styling sidebar
    st.markdown("""
    <style>
        [data-testid="stSidebarNav"] {
            display: none !important;
        }

        section[data-testid="stSidebar"] {
            background-color: #1E293B !important;
        }

        section[data-testid="stSidebar"] > div {
            background-color: #1E293B !important;
        }

        section[data-testid="stSidebar"] * {
            color: #F8FAFC !important;
        }

        .brand-sub {
            color: #10B981 !important;
        }

        .menu-title {
            color: #64748B !important;
        }

        section[data-testid="stSidebar"] a p {
            font-size: 16px !important;
            font-weight: 500 !important;
            padding-left: 8px !important;
            transition: color 0.2s ease;
        }

        section[data-testid="stSidebar"] a:hover p {
            color: #10B981 !important;
        }
        section[data-testid="stSidebar"] .stButton > button {
            background-color: #10B981 !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
        }

        section[data-testid="stSidebar"] .stButton > button:hover {
            background-color: #059669 !important;
            color: white !important;
        }

        section[data-testid="stSidebar"] .stButton > button:focus {
            box-shadow: none !important;
            border: none !important;
        }
    </style>
    """, unsafe_allow_html=True)

    with st.sidebar:

        # Branding
        st.markdown("""
        <div style='text-align: center; margin-bottom: 40px; margin-top: 10px;'>
            <h1 style='margin-bottom: -15px; font-size: 20px; color: #F8FAFC; letter-spacing: -1px;'>
                SnapFlow
            </h1>
            <p class='brand-sub' style='font-weight: 600; color: #94A3B8;'>
                AI Workplace Assistant
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Navigasi
        st.markdown(
            """
            <p class='menu-title'
               style='font-size: 12px; margin-bottom: 10px; font-weight: bold; letter-spacing: 1px;'>
               MENU UTAMA
            </p>
            """,
            unsafe_allow_html=True
        )

        st.page_link(
            "pages/01_Dashboard.py",
            label="Dashboard"
        )

        st.page_link(
            "pages/02_Klasifikasi.py",
            label="Klasifikasi"
        )

        st.page_link(
            "pages/03_Ringkasan.py",
            label="Ringkasan"
        )

        st.page_link(
            "pages/04_Tanya_Jawab.py",
            label="Tanya Jawab"
        )

        st.page_link(
            "pages/05_History.py",
            label="History"
        )

        st.page_link(
            "pages/06_Meeting.py",
            label="Meeting"
        )

        st.markdown(
            "<hr style='border-color: #334155; margin: 25px 0;'>",
            unsafe_allow_html=True
        )

        # Informasi pengguna
        if (
            'logged_in' in st.session_state
            and st.session_state['logged_in']
        ):
            st.markdown("""
            <div style='background-color: #0F172A; padding: 15px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 15px;'>
                <p style='margin: 0; font-size: 13px; color: #94A3B8;'>
                    Masuk sebagai:
                </p>
                <strong style='color: #F8FAFC; font-size: 16px;'>
                    Admin User
                </strong>
            </div>
            """, unsafe_allow_html=True)

            if st.button(
                "Keluar Aplikasi",
                use_container_width=True
            ):
                st.session_state['logged_in'] = False
                st.session_state.clear()
                st.switch_page("pages/login.py")

        # Footer
        st.markdown("""
        <div style='text-align: center; margin-top: 40px;'>
            <p class='menu-title' style='font-size: 12px; margin: 0;'>
                SnapFlow v1.0
            </p>
            <p class='menu-title' style='font-size: 11px; margin: 0;'>
                © 2026 Capstone Project
            </p>
        </div>
        """, unsafe_allow_html=True)