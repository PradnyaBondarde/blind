import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const GuardianSignup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Generate Guardian ID like Guardian001, Guardian002, ...
    const generateGuardianId = async () => {
        const { data, error } = await supabase
            .from("guardians")
            .select("guardian_id")
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching last guardian:", error);
            return "Guardian001";
        }

        if (data && data.length > 0) {
            const lastId = data[0].guardian_id;
            const lastNum = parseInt(lastId.replace("Guardian", ""), 10) || 0;
            const newNum = lastNum + 1;
            return `Guardian${String(newNum).padStart(3, "0")}`;
        } else {
            return "Guardian001";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.endsWith("@gmail.com")) {
            alert("Email must end with @gmail.com");
            return;
        }

        if (!name.trim() || !email.trim() || !password.trim()) {
            alert("All fields are required");
            return;
        }

        setLoading(true);

        try {
            // Check if email already exists
            const { data: existing, error: checkError } = await supabase
                .from("guardians")
                .select("id")
                .eq("email", email)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existing) {
                alert("Email already exists. Redirecting to login...");
                navigate("/guardian/login");
                return;
            }

            // Generate Guardian ID sequentially
            const guardian_id = await generateGuardianId();

            // Insert new guardian
            const { error: insertError } = await supabase.from("guardians").insert([
                {
                    guardian_id,
                    name: name.trim(),
                    email: email.trim(),
                    password: password.trim(),
                },
            ]);

            if (insertError) throw insertError;

            alert(`✅ Account created! Your Guardian ID is ${guardian_id}`);
            navigate("/guardian/profile", { state: { email } });
        } catch (error) {
            console.error("Signup Error:", error);
            alert("❌ Error during signup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Guardian Registration</h1>
                <p style={styles.subtitle}>Create your guardian account</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        style={styles.input}
                        required
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (must end with @gmail.com)"
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        style={styles.input}
                        required
                    />
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(loading ? styles.disabledButton : {}),
                        }}
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account?{" "}
                    <span
                        style={styles.link}
                        onClick={() => navigate("/guardian/login")}
                    >
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
};

// 🎨 Styles
const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    card: {
        background: "#fff",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
        width: "400px",
        textAlign: "center",
    },
    title: {
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "10px",
    },
    subtitle: {
        color: "#718096",
        marginBottom: "20px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    input: {
        padding: "12px",
        fontSize: "16px",
        borderRadius: "8px",
        border: "2px solid #e2e8f0",
        outline: "none",
    },
    button: {
        background: "#667eea",
        color: "#fff",
        border: "none",
        padding: "12px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "600",
    },
    disabledButton: {
        background: "#a0aec0",
        cursor: "not-allowed",
    },
    footer: {
        marginTop: "15px",
        color: "#2d3748",
    },
    link: {
        color: "#667eea",
        cursor: "pointer",
        fontWeight: "600",
    },
};

export default GuardianSignup;
