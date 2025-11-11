import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const GuardianLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            alert("Please enter both email and password");
            return;
        }

        setLoading(true);
        try {
            // 🔍 Find guardian with matching email + password
            const { data, error } = await supabase
                .from("guardians")
                .select("*")
                .eq("email", email)
                .eq("password", password)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                alert("Invalid credentials");
                return;
            }

            // ✅ Navigate based on profile completion
            if (data.profile_completed === true) {
                navigate("/guardian/home", { state: { guardian: data } });
            } else {
                navigate("/guardian/profile", { state: { email: data.email } });
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignupRedirect = () => {
        navigate("/guardian/signup");
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.iconWrapper}>
                        <svg
                            style={styles.icon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h1 style={styles.title}>Guardian Login</h1>
                    <p style={styles.subtitle}>
                        Welcome back! Please login to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContainer}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="your.email@gmail.com"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {}),
                        }}
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div style={styles.divider}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>OR</span>
                    <div style={styles.dividerLine}></div>
                </div>

                <div style={styles.footer}>
                    <p style={styles.footerText}>
                        Don’t have an account?{" "}
                        <span style={styles.link} onClick={handleSignupRedirect}>
                            Sign up here
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        padding: "40px",
        maxWidth: "450px",
        width: "100%",
        animation: "slideIn 0.4s ease-out",
    },
    header: {
        textAlign: "center",
        marginBottom: "32px",
    },
    iconWrapper: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        backgroundColor: "#edf2f7",
        marginBottom: "20px",
    },
    icon: {
        width: "40px",
        height: "40px",
        color: "#667eea",
    },
    title: {
        fontSize: "32px",
        fontWeight: "700",
        color: "#1a202c",
        margin: "0 0 8px 0",
    },
    subtitle: {
        fontSize: "16px",
        color: "#718096",
        margin: 0,
    },
    formContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#2d3748",
        marginBottom: "4px",
    },
    input: {
        padding: "14px 16px",
        fontSize: "16px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        outline: "none",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
    },
    button: {
        padding: "16px",
        fontSize: "16px",
        fontWeight: "600",
        color: "#ffffff",
        backgroundColor: "#667eea",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginTop: "8px",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
    },
    buttonDisabled: {
        backgroundColor: "#a0aec0",
        cursor: "not-allowed",
        boxShadow: "none",
    },
    divider: {
        display: "flex",
        alignItems: "center",
        margin: "24px 0",
        gap: "12px",
    },
    dividerLine: {
        flex: 1,
        height: "1px",
        backgroundColor: "#e2e8f0",
    },
    dividerText: {
        fontSize: "14px",
        color: "#a0aec0",
        fontWeight: "600",
    },
    footer: {
        textAlign: "center",
    },
    footerText: {
        fontSize: "14px",
        color: "#718096",
        margin: 0,
    },
    link: {
        color: "#667eea",
        fontWeight: "600",
        cursor: "pointer",
        textDecoration: "none",
        transition: "color 0.2s ease",
    },
};

// Inject hover styles only once
if (!document.getElementById("guardian-login-style")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "guardian-login-style";
    styleSheet.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    input:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.1) !important;
    }
    button:not(:disabled):hover {
      background-color: #5568d3 !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102,126,234,0.5) !important;
    }
    button:not(:disabled):active {
      transform: translateY(0);
    }
    span[style*="cursor: pointer"]:hover {
      color: #5568d3 !important;
      text-decoration: underline;
    }
  `;
    document.head.appendChild(styleSheet);
}

export default GuardianLogin;
