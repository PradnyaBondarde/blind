import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const GuardianProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || ""; // ✅ email passed from signup/login

    const [guardian, setGuardian] = useState(null);
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    // ✅ Fetch guardian from table
    useEffect(() => {
        const fetchGuardian = async () => {
            try {
                if (!email) {
                    alert("Email not found. Please login again.");
                    navigate("/guardian/login");
                    return;
                }

                const { data, error } = await supabase
                    .from("guardians")
                    .select("*")
                    .eq("email", email)
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    setGuardian(data);
                    setPhone(data.phone || "");
                    setCity(data.city || "");
                    setAddress(data.location || "");
                }
            } catch (err) {
                console.error("Error fetching guardian:", err);
                alert("Error loading profile. Please try again.");
            } finally {
                setFetchLoading(false);
            }
        };
        fetchGuardian();
    }, [email, navigate]);

    // ✅ File upload to guardian_docs
    const uploadFile = async (file, folder) => {
        if (!file) return null;
        const ext = file.name.split(".").pop();
        const fileName = `${guardian.guardian_id}_${Date.now()}.${ext}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("guardian_docs")
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from("guardian_docs")
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    // ✅ Handle save
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!phone || !city || !address || !aadhaarFile || !panFile) {
            alert("Please fill all fields and upload both Aadhaar & PAN documents.");
            return;
        }

        if (phone.length !== 10) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }

        setLoading(true);

        try {
            const aadhaarUrl = await uploadFile(aadhaarFile, "aadhaar");
            const panUrl = await uploadFile(panFile, "pan");

            console.log("Updating guardian:", {
                email,
                phone,
                city,
                address,
                aadhaarUrl,
                panUrl,
            });

            const { error } = await supabase
                .from("guardians")
                .update({
                    phone,
                    city,
                    location: address,
                    aadhaar_url: aadhaarUrl || "",
                    pan_url: panUrl || "",
                    profile_completed: true,
                })
                .eq("email", email);

            if (error) throw error;

            alert("✅ Profile completed successfully!");
            navigate("/guardian/home", { state: { guardian } });
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("❌ Error saving profile. Please check console for details.");
        } finally {
            setLoading(false);
        }
    };

    // Loading & not found states
    if (fetchLoading)
        return (
            <div style={styles.centerBox}>
                <h3>Loading profile...</h3>
            </div>
        );

    if (!guardian)
        return (
            <div style={styles.centerBox}>
                <h3>Guardian not found</h3>
            </div>
        );

    // ✅ Main Profile UI
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Complete Your Profile</h1>
                <p style={styles.subtitle}>
                    Hello, {guardian.name}! Fill in the details below.
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.info}>
                        <p>
                            <strong>Email:</strong> {guardian.email}
                        </p>
                        <p>
                            <strong>Guardian ID:</strong> {guardian.guardian_id}
                        </p>
                    </div>

                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="Enter 10-digit phone number"
                        style={styles.input}
                        required
                    />

                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Enter your city"
                        style={styles.input}
                        required
                    />

                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your address"
                        style={{ ...styles.input, minHeight: "80px" }}
                        required
                    />

                    <label style={styles.label}>Upload Aadhaar Card</label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setAadhaarFile(e.target.files[0])}
                        style={styles.input}
                        required
                    />

                    <label style={styles.label}>Upload PAN Card</label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPanFile(e.target.files[0])}
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
                        {loading ? "Saving Profile..." : "Complete Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ✅ Styles
const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        minHeight: "100vh",
        padding: "20px",
    },
    card: {
        background: "#fff",
        borderRadius: "20px",
        padding: "30px 40px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        maxWidth: "500px",
        width: "100%",
        animation: "slideIn 0.3s ease-out",
    },
    title: {
        textAlign: "center",
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "8px",
    },
    subtitle: {
        textAlign: "center",
        color: "#718096",
        marginBottom: "20px",
    },
    info: {
        background: "#f7fafc",
        borderRadius: "10px",
        padding: "10px 15px",
        marginBottom: "20px",
    },
    input: {
        width: "100%",
        padding: "12px 14px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        marginBottom: "15px",
        outline: "none",
        fontSize: "15px",
    },
    label: {
        fontWeight: "600",
        marginBottom: "8px",
    },
    button: {
        width: "100%",
        padding: "14px",
        backgroundColor: "#667eea",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        transition: "all 0.3s ease",
    },
    disabledButton: {
        backgroundColor: "#a0aec0",
        cursor: "not-allowed",
    },
    centerBox: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        color: "#fff",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        fontSize: "20px",
    },
};

// ✅ Inject style animation only once
if (!document.getElementById("guardian-profile-style")) {
    const style = document.createElement("style");
    style.id = "guardian-profile-style";
    style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    input:focus, textarea:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.2) !important;
    }
    button:hover:not(:disabled) {
      background-color: #5568d3 !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102,126,234,0.5);
    }
  `;
    document.head.appendChild(style);
}

export default GuardianProfile;
