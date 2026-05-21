import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  // Auth state
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Password reset (inside dashboard)
  const [resetCurrentPassword, setResetCurrentPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  // Password setup/reset state
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'setup' | 'forgot'
  const [setupOtp, setSetupOtp] = useState("");
  const [setupNewPassword, setSetupNewPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [otpReceived, setOtpReceived] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  // Tab navigation
  const [activeTab, setActiveTab] = useState("employees"); // 'employees' | 'attendance' | 'jobs' | 'applications' | 'requests' | 'daily_ratings'

  // Data lists
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [adminTrackerRecords, setAdminTrackerRecords] = useState([]);
  const [adminDailyRatings, setAdminDailyRatings] = useState([]);
  const [adminDailyRatingsSummary, setAdminDailyRatingsSummary] = useState([]);

  // Form states for creating jobs
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");

  // Employee form states
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empDoj, setEmpDoj] = useState("");
  const [empAddress, setEmpAddress] = useState("");
  const [empAadhaar, setEmpAadhaar] = useState("");
  const [empDesignation, setEmpDesignation] = useState("");
  const [empReportingManager, setEmpReportingManager] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  // Employee credential management states
  const [credentialEmployee, setCredentialEmployee] = useState(null);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState(null);
  const [resetEmpNewPassword, setResetEmpNewPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  // Employee Records tab states
  const [selectedRecordEmployee, setSelectedRecordEmployee] = useState(null);
  const [recordFormData, setRecordFormData] = useState({
    gender: "Male", employee_id: "", address: "", pan: "", aadhaar: "",
    dob: "", branch: "", name_as_per_records: "", father_name: "",
    fixed_gross_salary: 0, basic_salary: 0, hra: 0, conveyance_allowance: 0,
    medical_allowance: 0, days_payable: 30, pf_esi_el: "",
    bank_name: "", account_number: "", ifsc_code: "", bank_branch_name: ""
  });
  const [showRecordForm, setShowRecordForm] = useState(false);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Daily ratings filtering states
  const [ratingSearchQuery, setRatingSearchQuery] = useState("");
  const [ratingColorFilter, setRatingColorFilter] = useState("All");
  const [ratingMonthFilter, setRatingMonthFilter] = useState("");

  // Selection Tracker states
  const [selectionMonth, setSelectionMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });
  const [selectionSummary, setSelectionSummary] = useState([]);
  const [selectionDetails, setSelectionDetails] = useState([]);
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState(null);

  const BACKEND_URL = "http://localhost:5000";

  // Load session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedAdmin = localStorage.getItem("adminProfile");

    if (savedToken && savedAdmin) {
      setToken(savedToken);
      const parsedAdmin = JSON.parse(savedAdmin);
      setAdmin(parsedAdmin);
      setAdminEmail(parsedAdmin.email || "");

      // Background fetch fresh profile details
      fetch("http://localhost:5000/api/admin/profile", {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.email) {
          setAdmin(data);
          setAdminEmail(data.email);
          localStorage.setItem("adminProfile", JSON.stringify(data));
        }
      })
      .catch(err => console.error("Error fetching fresh admin profile on mount:", err));
    }
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdmin(data);
        setAdminEmail(data.email || "");
        localStorage.setItem("adminProfile", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
    }
  };

  // Fetch data depending on active tab when token is present
  useEffect(() => {
    if (token) {
      if (activeTab === "employees" || activeTab === "salary_sheets" || activeTab === "employee_records") {
        fetchEmployees();
      } else if (activeTab === "attendance") {
        fetchAttendance();
        fetchEmployees();
      } else if (activeTab === "jobs") {
        fetchJobs();
      } else if (activeTab === "applications") {
        fetchApplications();
      } else if (activeTab === "requests") {
        fetchHiringRequests();
      } else if (activeTab === "performance_tracker") {
        fetchAdminTrackerRecords();
      } else if (activeTab === "daily_ratings") {
        fetchAdminDailyRatings();
        fetchAdminDailyRatingsSummary();
      } else if (activeTab === "selection_tracker") {
        fetchSelectionSummary();
      } else if (activeTab === "settings") {
        fetchAdminProfile();
      }
    }
  }, [activeTab, token]);

  // ==========================================
  // ADMIN AUTH HANDLERS
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminProfile", JSON.stringify(data.admin));

      setToken(data.token);
      setAdmin(data.admin);
      setAdminEmail(data.admin.email || "");
      setSuccess("Welcome, login successful!");
      setLoginUsername("");
      setLoginPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdminEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: adminEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update email");
      }

      setSuccess(data.message);
      setAdmin(data.admin);
      setAdminEmail(data.admin.email || "");
      localStorage.setItem("adminProfile", JSON.stringify(data.admin));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSetupOtp = async () => {
    if (!loginUsername.trim()) {
      setError("Please enter your admin username first.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint = authMode === "setup" ? "/api/admin/setup-password-otp" : "/api/admin/forgot-password-otp";
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpRequested(true);
      setSuccess(data.message);
      if (data.otp) {
        setOtpReceived(data.otp);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (setupNewPassword !== setupConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (setupNewPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint = authMode === "setup" ? "/api/admin/setup-password" : "/api/admin/reset-password";
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          otp: setupOtp.trim(),
          new_password: setupNewPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set password");
      }

      setSuccess(data.message + " Redirecting to login...");
      setTimeout(() => {
        setAuthMode("login");
        resetSetupState();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSetupState = () => {
    setSetupOtp("");
    setSetupNewPassword("");
    setSetupConfirmPassword("");
    setOtpReceived("");
    setOtpRequested(false);
    setError("");
    setSuccess("");
  };

  const handleSignOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminProfile");
    setToken("");
    setAdmin(null);
    setSuccess("Logged out successfully.");
  };

  // ==========================================
  // DATA FETCHERS
  // ==========================================

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAttendanceLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } catch (err) {
      console.error("Failed to load employee directory:", err.message);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHiringRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/hiring-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminTrackerRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/performance-tracker`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdminTrackerRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDailyRatings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/daily-ratings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdminDailyRatings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDailyRatingsSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/daily-ratings/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdminDailyRatingsSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectionSummary = async (month = selectionMonth) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/selection-entries/summary?month=${encodeURIComponent(month)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectionSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectionDetails = async (employeeId, month = selectionMonth) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/selection-entries?employee_id=${employeeId}&month=${encodeURIComponent(month)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectionDetails(data);
      setSelectedEmployeeForDetails(employeeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSelectionTracker = (employeeId = null) => {
    try {
      const dataToExport = employeeId ? selectionDetails : selectionSummary;
      if (!dataToExport || dataToExport.length === 0) {
        setError("No data to export.");
        return;
      }

      let rows = [];
      if (employeeId) {
        rows = dataToExport.map((rec, index) => ({
          "Sl No": index + 1,
          "Date Added": new Date(rec.created_at).toLocaleDateString("en-IN"),
          "Candidate Name": rec.candidate_name,
          "Mobile Number": rec.mobile_number,
          "Email": rec.email || "",
          "Client Name": rec.client_name,
          "Designation": rec.designation || "",
          "Location": rec.location || "",
          "Selected": rec.selected
        }));
      } else {
        rows = dataToExport.map((rec, index) => ({
          "Sl No": index + 1,
          "Employee Name": rec.employee_name,
          "Month": rec.month,
          "Selections (Yes)": rec.yes_count,
          "Score (%)": rec.score,
          "Status": rec.status
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, employeeId ? "Employee Selection Details" : "Selection Summary");
      XLSX.writeFile(workbook, `Selection_Tracker_${selectionMonth}.xlsx`);
      setSuccess("Selection Tracker downloaded successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadSalaryExcel = () => {
    try {
      if (employees.length === 0) {
        setError("No employee records to export.");
        return;
      }

      const rows = employees.map((emp, index) => {
        const fixedGross = Number(emp.fixed_gross_salary) || 0;
        const basic = Number(emp.basic_salary) || 0;
        const hra = Number(emp.hra) || 0;
        const conveyance = Number(emp.conveyance_allowance) || 0;
        const medical = Number(emp.medical_allowance) || 0;
        const days = Number(emp.days_payable) || 30;

        const totalGross = basic + hra + conveyance + medical;
        const earnedBasic = Math.round(((basic / 30) * days) * 100) / 100;
        const earnedHra = Math.round(((hra / 30) * days) * 100) / 100;
        const earnedConveyance = Math.round(((conveyance / 30) * days) * 100) / 100;
        const earnedMedical = Math.round(((medical / 30) * days) * 100) / 100;
        const earnedGross = Math.round((earnedBasic + earnedHra + earnedConveyance + earnedMedical) * 100) / 100;

        const pt = earnedGross > 15000 ? 200 : 0;
        const totalDeductions = pt;
        const netTakeHome = Math.round((earnedGross - totalDeductions) * 100) / 100;

        return {
          "SL No.": index + 1,
          "Branch": emp.branch || "",
          "Employee": emp.employee_id || "",
          "Name as per Records": emp.name_as_per_records || "",
          "Name of the Employee": emp.name || "",
          "Father’s Name": emp.father_name || "",
          "Date of Joining": emp.doj ? new Date(emp.doj).toLocaleDateString("en-IN") : "",
          "Date of Birth": emp.dob ? new Date(emp.dob).toLocaleDateString("en-IN") : "",
          "Designation": emp.designation || "",
          "Fixed Gross Salary": fixedGross,
          "Basic Salary": basic,
          "HRA": hra,
          "Conveyance Allowance": conveyance,
          "Medical Allowance": medical,
          "Total Gross": totalGross,
          "Days Payable": days,
          "Earned Basic": earnedBasic,
          "Earned HRA": earnedHra,
          "Earned Conveyance": earnedConveyance,
          "Earned Medical": earnedMedical,
          "Earned Gross": earnedGross,
          "PT": pt,
          "Total Deductions": totalDeductions,
          "Net Take Home": netTakeHome,
          "PF / ESI / EL": emp.pf_esi_el || "",
          "Bank Name": emp.bank_name || "",
          "Account Number": emp.account_number || "",
          "IFSC Code": emp.ifsc_code || "",
          "Branch Name": emp.bank_branch_name || ""
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Sheets");
      XLSX.writeFile(workbook, `Salary_Sheet_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`);
      setSuccess("Salary Sheet downloaded successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadTrackerExcel = () => {
    try {
      if (adminTrackerRecords.length === 0) {
        setError("No candidate records to export.");
        return;
      }

      const rows = adminTrackerRecords.map((rec, index) => ({
        "Sl No": index + 1,
        "Candidate Employee ID": rec.recruiter_employee_id || "",
        "Client Name": rec.client_name || "",
        "Offer Month": rec.offer_month || "",
        "Team Leader": rec.team_leader || "",
        "Recruiter Name": rec.recruiter_name || "",
        "Candidate Name": rec.candidate_name || "",
        "Mobile Number": rec.mobile_number || "",
        "HR Confirmation Mail Received (Yes/No)": rec.hr_confirmation_mail || "No",
        "Team Manager Approved (Yes/No)": rec.team_manager_approved || "No",
        "Applied Designation": rec.applied_designation || "",
        "Current Location": rec.current_location || "",
        "Client HR Name": rec.client_hr_name || "",
        "Current Company": rec.current_company || "",
        "Current Designation": rec.current_designation || "",
        "Total Experience": rec.total_experience || "",
        "Current CTC": rec.current_ctc || "",
        "Candidate DOJ": rec.candidate_doj ? new Date(rec.candidate_doj).toLocaleDateString("en-IN") : "",
        "Joined (Yes/No)": rec.joined || "No"
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Review Tracker");
      XLSX.writeFile(workbook, `Candidate_Performance_Tracker_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`);
      setSuccess("Performance tracker sheet downloaded successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadDailyRatingsExcel = () => {
    try {
      if (adminDailyRatings.length === 0) {
        setError("No daily ratings logged to export.");
        return;
      }

      const rows = [];
      adminDailyRatings.forEach((rating) => {
        if (rating.rating_color === "Green" && rating.joinings && rating.joinings.length > 0) {
          rating.joinings.forEach((j) => {
            rows.push({
              "Sl No": rows.length + 1,
              "Date": new Date(rating.rating_date).toLocaleDateString("en-IN"),
              "Recruiter ID": rating.emp_code || "",
              "Recruiter Name": rating.employee_name || "",
              "Rating": "🟢 Green",
              "Candidate Name": j.candidate_name,
              "Mobile Number": j.mobile_number,
              "Client Name": j.client_name,
              "Location": j.location,
              "Designation": j.designation,
              "Joining Month": j.month
            });
          });
        } else {
          rows.push({
            "Sl No": rows.length + 1,
            "Date": new Date(rating.rating_date).toLocaleDateString("en-IN"),
            "Recruiter ID": rating.emp_code || "",
            "Recruiter Name": rating.employee_name || "",
            "Rating": "🔴 Red",
            "Candidate Name": "—",
            "Mobile Number": "—",
            "Client Name": "—",
            "Location": "—",
            "Designation": "—",
            "Joining Month": "—"
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Ratings & Joinings");
      XLSX.writeFile(workbook, `Recruitment_Daily_Ratings_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`);
      setSuccess("Daily ratings sheet downloaded successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // EMPLOYEE MANAGEMENT HANDLERS
  // ==========================================

  const resetEmployeeForm = () => {
    setEmpName("");
    setEmpEmail("");
    setEmpPhone("");
    setEmpDoj("");
    setEmpAddress("");
    setEmpAadhaar("");
    setEmpDesignation("");
    setEmpReportingManager("");
    setEmpPassword("");
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmpName(emp.name || "");
    setEmpEmail(emp.email || "");
    setEmpPhone(emp.phone || "");
    setEmpDoj(emp.doj ? emp.doj.substring(0, 10) : "");
    setEmpAddress(emp.address || "");
    setEmpAadhaar(emp.aadhaar || "");
    setEmpDesignation(emp.designation || "");
    setEmpReportingManager(emp.reporting_manager || "");
    setEmpPassword("");
    setShowEmployeeForm(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      name: empName,
      email: empEmail,
      phone: empPhone,
      doj: empDoj || null,
      address: empAddress,
      aadhaar: empAadhaar,
      designation: empDesignation,
      reporting_manager: empReportingManager,
      password: empPassword || undefined,
    };

    try {
      let res;
      if (editingEmployee) {
        res = await fetch(`${BACKEND_URL}/api/admin/employees/${editingEmployee.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/admin/employees`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(editingEmployee ? "Employee updated successfully!" : "Employee registered successfully!");
      resetEmployeeForm();
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Credential Management Handlers
  const handleSetCredentials = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/employees/create-credentials`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: credentialEmployee.id, password: credentialPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      setShowCredentialModal(false);
      setCredentialPassword("");
      setCredentialEmployee(null);
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmployeePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/employees/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: resetPasswordEmployee.id, new_password: resetEmpNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      setShowResetModal(false);
      setResetEmpNewPassword("");
      setResetPasswordEmployee(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Employee Records Handlers
  const openRecordEdit = (emp) => {
    setSelectedRecordEmployee(emp);
    setRecordFormData({
      gender: emp.gender || "Male",
      employee_id: emp.employee_id || "",
      address: emp.address || "",
      pan: emp.pan || "",
      aadhaar: emp.aadhaar || "",
      dob: emp.dob ? emp.dob.substring(0, 10) : "",
      branch: emp.branch || "",
      name_as_per_records: emp.name_as_per_records || "",
      father_name: emp.father_name || "",
      fixed_gross_salary: Number(emp.fixed_gross_salary) || 0,
      basic_salary: Number(emp.basic_salary) || 0,
      hra: Number(emp.hra) || 0,
      conveyance_allowance: Number(emp.conveyance_allowance) || 0,
      medical_allowance: Number(emp.medical_allowance) || 0,
      days_payable: Number(emp.days_payable) || 30,
      pf_esi_el: emp.pf_esi_el || "",
      bank_name: emp.bank_name || "",
      account_number: emp.account_number || "",
      ifsc_code: emp.ifsc_code || "",
      bank_branch_name: emp.bank_branch_name || ""
    });
    setShowRecordForm(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/employees/${selectedRecordEmployee.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedRecordEmployee.name,
          email: selectedRecordEmployee.email,
          ...recordFormData
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Employee record updated successfully!");
      setShowRecordForm(false);
      setSelectedRecordEmployee(null);
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId) => {
    if (!window.confirm("Are you sure you want to remove this employee? This action cannot be undone.")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/employees/${empId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Employee removed successfully!");
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  // Attendance handlers
  const handleAuthorizeAttendance = async (attendanceId, status) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/attendance/authorize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendance_id: attendanceId, status }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess(`Attendance marked ${status.toLowerCase()} successfully.`);
      fetchAttendance();
    } catch (err) {
      setError(err.message);
    }
  };

  // Job handlers
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!jobTitle || !jobDescription || !jobRequirements || !jobLocation) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription,
          requirements: jobRequirements,
          salary_range: jobSalary,
          location: jobLocation,
          job_type: jobType,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess("Job listing published successfully!");
      setJobTitle("");
      setJobDescription("");
      setJobRequirements("");
      setJobSalary("");
      setJobLocation("");
      setJobType("Full-time");
      fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    setError("");
    setSuccess("");
    if (!window.confirm("Are you sure you want to delete this job listing?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess("Job listing deleted successfully!");
      fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // RENDER: LOGIN / SETUP / FORGOT PASSWORD
  // ==========================================

  if (!admin) {
    return (
      <div className="admin-app">
        <div className="glow-pink" />
        <div className="glow-purple" />
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="brand-header" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <img src="/icon.png" alt="Million Talents Logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.5rem" }}>
                {authMode === "login" ? "Admin Login" : authMode === "setup" ? "Setup Password" : "Reset Password"}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
                {authMode === "login"
                  ? "Sign in to the MTI Admin Console"
                  : authMode === "setup"
                  ? "Set your password via OTP sent to your registered admin email address."
                  : "Reset your password via OTP sent to your registered admin email address."}
              </p>
            </div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}
            {success && <div className="alert alert-success">✨ {success}</div>}

            {/* OTP Received Helper */}
            {otpReceived && (
              <div className="alert" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#a78bfa", borderColor: "rgba(139, 92, 246, 0.3)" }}>
                💡 <strong>Testing Mode OTP:</strong>{" "}
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.15em", color: "#FF4D8D" }}>{otpReceived}</span>
              </div>
            )}

            {/* LOGIN MODE */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Email or Username</label>
                  <input
                    type="text"
                    required
                    placeholder="eswar@selfeey.com"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="form-input"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Authenticating..." : "Login"}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("setup"); resetSetupState(); }}
                    className="btn-link"
                  >
                    First Time Setup
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("forgot"); resetSetupState(); }}
                    className="btn-link"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            )}

            {/* SETUP / FORGOT PASSWORD MODE */}
            {(authMode === "setup" || authMode === "forgot") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Admin Username</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="form-input"
                    disabled={otpRequested}
                  />
                </div>

                {!otpRequested ? (
                  <button onClick={handleRequestSetupOtp} disabled={loading} className="btn-primary">
                    {loading ? "Sending OTP..." : `Send OTP to eswar@selfeey.com`}
                  </button>
                ) : (
                  <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label>6-Digit OTP</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={setupOtp}
                        onChange={(e) => setSetupOtp(e.target.value)}
                        className="form-input"
                        style={{ textAlign: "center", letterSpacing: "0.25em", fontFamily: "monospace", fontSize: "1.1rem" }}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Min. 6 characters"
                        value={setupNewPassword}
                        onChange={(e) => setSetupNewPassword(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? "Setting Password..." : authMode === "setup" ? "Set Password" : "Reset Password"}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); resetSetupState(); }}
                  className="btn-link"
                  style={{ textAlign: "center" }}
                >
                  ← Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMIN DASHBOARD
  // ==========================================

  return (
    <div className="admin-app">
      <div className="glow-pink" />
      <div className="glow-purple" />

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-info" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/icon.png" alt="Million Talents Logo" style={{ width: "48px", height: "48px", objectFit: "contain" }} />
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>MTI Admin Console</h2>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0 }}>
              Welcome, {admin?.username} &bull; {admin?.email || "eswar@selfeey.com"}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={handleSignOut} className="btn-logout">
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="tabs-bar">
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("employees"); }}
          className={`tab-btn ${activeTab === "employees" ? "active" : ""}`}
        >
          👥 Employee Management
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("employee_records"); }}
          className={`tab-btn ${activeTab === "employee_records" ? "active" : ""}`}
        >
          🗂️ Employee Records
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("salary_sheets"); }}
          className={`tab-btn ${activeTab === "salary_sheets" ? "active" : ""}`}
        >
          💵 Salary Sheets
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("attendance"); }}
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
        >
          📋 Attendance Review
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("jobs"); }}
          className={`tab-btn ${activeTab === "jobs" ? "active" : ""}`}
        >
          💼 Job Listings
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("applications"); }}
          className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
        >
          📄 Candidate Applications
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("requests"); }}
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
        >
          🤝 Hiring Inquiries
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("performance_tracker"); }}
          className={`tab-btn ${activeTab === "performance_tracker" ? "active" : ""}`}
        >
          ⭐ Performance Tracker
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("daily_ratings"); }}
          className={`tab-btn ${activeTab === "daily_ratings" ? "active" : ""}`}
        >
          📈 Daily Self-Ratings
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("selection_tracker"); }}
          className={`tab-btn ${activeTab === "selection_tracker" ? "active" : ""}`}
        >
          🎯 Selection Tracker
        </button>
        <button
          onClick={() => { setError(""); setSuccess(""); setActiveTab("settings"); }}
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
        >
          ⚙️ Settings
        </button>
      </nav>

      {/* Alert panels */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✨ {success}</div>}

      {/* ==========================================
          TAB CONTENT: EMPLOYEE MANAGEMENT
          ========================================== */}
      {activeTab === "employees" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Header Row */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Employee Directory</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Register employees and manage their login credentials. Employees login with Email + Password on the Employee Portal.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={fetchEmployees} className="btn-logout" style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}>
                  Refresh
                </button>
                <button
                  onClick={() => { resetEmployeeForm(); setShowEmployeeForm(true); }}
                  className="btn-primary"
                  style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}
                >
                  + Add Employee
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="val">{employees.length}</span>
                <span className="lbl">Total Employees</span>
              </div>
              <div className="stat-card">
                <span className="val">{employees.filter(e => e.password_hash).length}</span>
                <span className="lbl">Login Active</span>
              </div>
              <div className="stat-card">
                <span className="val">{employees.filter(e => !e.password_hash).length}</span>
                <span className="lbl">No Credentials</span>
              </div>
            </div>
          </div>

          {/* Add / Edit Employee Form (Simplified 6 fields) */}
          {showEmployeeForm && (
            <div className="panel-card" style={{ borderColor: "rgba(88, 214, 255, 0.3)" }}>
              <div className="panel-header">
                <h3>{editingEmployee ? "Edit Employee" : "Register New Employee"}</h3>
                <button onClick={resetEmployeeForm} className="btn-logout">✕ Close</button>
              </div>
              <form onSubmit={handleSaveEmployee} className="employee-form">
                <div className="form-group">
                  <label>Employee Name *</label>
                  <input type="text" required placeholder="John Doe" value={empName} onChange={(e) => setEmpName(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" required placeholder="john@milliontalentstech.com" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="text" required placeholder="+91 98765 43210" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Date of Joining *</label>
                  <input type="date" required value={empDoj} onChange={(e) => setEmpDoj(e.target.value)} className="form-input" />
                </div>
                <div className="form-group col-span-2">
                  <label>Location / Address *</label>
                  <input type="text" required placeholder="Bengaluru, Karnataka" value={empAddress} onChange={(e) => setEmpAddress(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Aadhaar Number *</label>
                  <input type="text" required placeholder="XXXX-XXXX-1234" value={empAadhaar} onChange={(e) => setEmpAadhaar(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input type="text" placeholder="Software Engineer" value={empDesignation} onChange={(e) => setEmpDesignation(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Reporting Manager</label>
                  <input type="text" placeholder="Manager Name" value={empReportingManager} onChange={(e) => setEmpReportingManager(e.target.value)} className="form-input" />
                </div>
                {!editingEmployee && (
                  <div className="form-group col-span-2">
                    <label>Set Login Password (min 6 chars, optional — can be set later)</label>
                    <input type="password" placeholder="••••••••" minLength={6} value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} className="form-input" />
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary col-span-2" style={{ marginTop: "0.5rem" }}>
                  {loading ? "Saving..." : editingEmployee ? "Update Employee" : "Register Employee"}
                </button>
              </form>
            </div>
          )}

          {/* Set Credentials Modal */}
          {showCredentialModal && credentialEmployee && (
            <div className="panel-card" style={{ borderColor: "rgba(88, 214, 255, 0.3)", maxWidth: "500px" }}>
              <div className="panel-header">
                <h3>🔑 Set Login Password for {credentialEmployee.name}</h3>
                <button onClick={() => { setShowCredentialModal(false); setCredentialPassword(""); }} className="btn-logout">✕ Close</button>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Email: <strong>{credentialEmployee.email}</strong> — This will be the employee's login email.
              </p>
              <form onSubmit={handleSetCredentials} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label>New Password *</label>
                  <input type="password" required minLength={6} placeholder="Min. 6 characters" value={credentialPassword} onChange={(e) => setCredentialPassword(e.target.value)} className="form-input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Setting..." : "Set Password & Enable Login"}
                </button>
              </form>
            </div>
          )}

          {/* Reset Password Modal */}
          {showResetModal && resetPasswordEmployee && (
            <div className="panel-card" style={{ borderColor: "rgba(239, 68, 68, 0.3)", maxWidth: "500px" }}>
              <div className="panel-header">
                <h3>🔒 Reset Password for {resetPasswordEmployee.name}</h3>
                <button onClick={() => { setShowResetModal(false); setResetEmpNewPassword(""); }} className="btn-logout">✕ Close</button>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Email: <strong>{resetPasswordEmployee.email}</strong>
              </p>
              <form onSubmit={handleResetEmployeePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label>New Password *</label>
                  <input type="password" required minLength={6} placeholder="Min. 6 characters" value={resetEmpNewPassword} onChange={(e) => setResetEmpNewPassword(e.target.value)} className="form-input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </div>
          )}

          {/* Employee Table */}
          <div className="panel-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th>DOJ</th>
                    <th>Reporting Manager</th>
                    <th>Login Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-text">No employees registered yet. Click "Add Employee" to get started.</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{emp.email}</div>
                          </div>
                        </td>
                        <td>{emp.designation || "—"}</td>
                        <td>{emp.phone || "—"}</td>
                        <td>{emp.doj ? new Date(emp.doj).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        <td>{emp.reporting_manager || "—"}</td>
                        <td>
                          {emp.password_hash ? (
                            <span className="badge badge-approved">✅ Active</span>
                          ) : (
                            <span className="badge badge-pending">⚠️ No Password</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ flexWrap: "wrap" }}>
                            <button onClick={() => openEditEmployee(emp)} className="btn-action-approve">Edit</button>
                            {!emp.password_hash ? (
                              <button onClick={() => { setCredentialEmployee(emp); setShowCredentialModal(true); setCredentialPassword(""); }} className="btn-action-approve" style={{ backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", borderColor: "rgba(139, 92, 246, 0.3)" }}>
                                Set Password
                              </button>
                            ) : (
                              <button onClick={() => { setResetPasswordEmployee(emp); setShowResetModal(true); setResetEmpNewPassword(""); }} className="btn-action-approve" style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                                Reset Password
                              </button>
                            )}
                            <button onClick={() => handleDeleteEmployee(emp.id)} className="btn-action-reject">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT: EMPLOYEE RECORDS (Detailed)
          ========================================== */}
      {activeTab === "employee_records" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Employee Records</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  View and manage detailed employee records: personal info, salary details, bank details, and more. Employees can also fill these from their own dashboard.
                </p>
              </div>
              <button onClick={fetchEmployees} className="btn-logout" style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}>
                Refresh
              </button>
            </div>
          </div>

          {/* Edit Record Form */}
          {showRecordForm && selectedRecordEmployee && (
            <div className="panel-card" style={{ borderColor: "rgba(88, 214, 255, 0.3)" }}>
              <div className="panel-header">
                <h3>Edit Records: {selectedRecordEmployee.name} ({selectedRecordEmployee.email})</h3>
                <button onClick={() => { setShowRecordForm(false); setSelectedRecordEmployee(null); }} className="btn-logout">✕ Close</button>
              </div>
              <form onSubmit={handleSaveRecord} className="employee-form">
                <div className="form-group">
                  <label>Gender</label>
                  <select value={recordFormData.gender} onChange={(e) => setRecordFormData({...recordFormData, gender: e.target.value})} className="form-input">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" placeholder="EMP-1001" value={recordFormData.employee_id} onChange={(e) => setRecordFormData({...recordFormData, employee_id: e.target.value})} className="form-input" />
                </div>
                <div className="form-group col-span-2">
                  <label>Address</label>
                  <input type="text" placeholder="Bengaluru, Karnataka" value={recordFormData.address} onChange={(e) => setRecordFormData({...recordFormData, address: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>PAN Number</label>
                  <input type="text" placeholder="ABCDE1234F" value={recordFormData.pan} onChange={(e) => setRecordFormData({...recordFormData, pan: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Aadhaar Number</label>
                  <input type="text" placeholder="XXXX-XXXX-1234" value={recordFormData.aadhaar} onChange={(e) => setRecordFormData({...recordFormData, aadhaar: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={recordFormData.dob} onChange={(e) => setRecordFormData({...recordFormData, dob: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <input type="text" placeholder="Bangalore" value={recordFormData.branch} onChange={(e) => setRecordFormData({...recordFormData, branch: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Name as per Records</label>
                  <input type="text" placeholder="Official Name" value={recordFormData.name_as_per_records} onChange={(e) => setRecordFormData({...recordFormData, name_as_per_records: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Father's Name</label>
                  <input type="text" placeholder="Father's Name" value={recordFormData.father_name} onChange={(e) => setRecordFormData({...recordFormData, father_name: e.target.value})} className="form-input" />
                </div>

                <div className="col-span-2" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", marginTop: "1rem", paddingTop: "1rem" }}>
                  <h4 style={{ color: "var(--accent-pink)", marginBottom: "0.5rem" }}>Salary & Bank Details</h4>
                </div>
                <div className="form-group">
                  <label>PF / ESI / EL</label>
                  <input type="text" placeholder="PF: 101, ESI: 202" value={recordFormData.pf_esi_el} onChange={(e) => setRecordFormData({...recordFormData, pf_esi_el: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" placeholder="HDFC Bank" value={recordFormData.bank_name} onChange={(e) => setRecordFormData({...recordFormData, bank_name: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input type="text" placeholder="1234567890" value={recordFormData.account_number} onChange={(e) => setRecordFormData({...recordFormData, account_number: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input type="text" placeholder="HDFC0000123" value={recordFormData.ifsc_code} onChange={(e) => setRecordFormData({...recordFormData, ifsc_code: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Bank Branch Name</label>
                  <input type="text" placeholder="Indiranagar" value={recordFormData.bank_branch_name} onChange={(e) => setRecordFormData({...recordFormData, bank_branch_name: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Fixed Gross Salary</label>
                  <input type="number" placeholder="50000" value={recordFormData.fixed_gross_salary || ""} onChange={(e) => setRecordFormData({...recordFormData, fixed_gross_salary: Number(e.target.value)})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Basic Salary</label>
                  <input type="number" placeholder="25000" value={recordFormData.basic_salary || ""} onChange={(e) => setRecordFormData({...recordFormData, basic_salary: Number(e.target.value)})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>HRA</label>
                  <input type="number" placeholder="10000" value={recordFormData.hra || ""} onChange={(e) => setRecordFormData({...recordFormData, hra: Number(e.target.value)})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Conveyance Allowance</label>
                  <input type="number" placeholder="2000" value={recordFormData.conveyance_allowance || ""} onChange={(e) => setRecordFormData({...recordFormData, conveyance_allowance: Number(e.target.value)})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Medical Allowance</label>
                  <input type="number" placeholder="1250" value={recordFormData.medical_allowance || ""} onChange={(e) => setRecordFormData({...recordFormData, medical_allowance: Number(e.target.value)})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Days Payable</label>
                  <input type="number" placeholder="30" value={recordFormData.days_payable || ""} onChange={(e) => setRecordFormData({...recordFormData, days_payable: Number(e.target.value)})} className="form-input" />
                </div>

                <button type="submit" disabled={loading} className="btn-primary col-span-2" style={{ marginTop: "0.5rem" }}>
                  {loading ? "Saving..." : "Save Record"}
                </button>
              </form>
            </div>
          )}

          {/* Employee Records Table */}
          <div className="panel-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Gender</th>
                    <th>PAN</th>
                    <th>Bank</th>
                    <th>Gross Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-text">No employee records found.</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{emp.email}</div>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--accent-pink)" }}>{emp.employee_id || "—"}</td>
                        <td>
                          <span className={`badge ${emp.gender === "Female" ? "badge-female" : "badge-male"}`}>
                            {emp.gender || "Male"}
                          </span>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{emp.pan || "—"}</td>
                        <td style={{ fontSize: "0.75rem" }}>{emp.bank_name || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{Number(emp.fixed_gross_salary) ? `₹${Number(emp.fixed_gross_salary).toLocaleString()}` : "—"}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => openRecordEdit(emp)} className="btn-action-approve">View / Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Attendance Review */}
      {activeTab === "attendance" && (
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3>Employee Attendance Logs</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Approve or reject clocked hours for employee shifts
              </p>
            </div>
            <button onClick={fetchAttendance} className="btn-logout" style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}>
              Refresh Data
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="val">{attendanceLogs.length}</span>
              <span className="lbl">Total Shift Records</span>
            </div>
            <div className="stat-card">
              <span className="val">{attendanceLogs.filter(a => a.status === "Pending").length}</span>
              <span className="lbl">Pending Auth</span>
            </div>
            <div className="stat-card">
              <span className="val">{employees.length}</span>
              <span className="lbl">Registered Employees</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Authorized By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-text">No attendance records submitted yet.</td>
                  </tr>
                ) : (
                  attendanceLogs.map((log) => {
                    const cIn = new Date(log.clock_in);
                    const cOut = log.clock_out ? new Date(log.clock_out) : null;
                    
                    let duration = "—";
                    if (cOut) {
                      const diffMs = cOut - cIn;
                      const hrs = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      duration = `${hrs}h ${mins}m`;
                    }

                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div className={`avatar-icon-sm ${log.employee_gender === "Female" ? "avatar-female" : "avatar-male"}`}>
                              {log.employee_gender === "Female" ? "♀" : "♂"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{log.employee_name}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{log.employee_email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace" }}>
                          {cIn.toLocaleDateString()} {cIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontFamily: "monospace" }}>
                          {cOut ? `${cOut.toLocaleDateString()} ${cOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Active Shift"}
                        </td>
                        <td>{duration}</td>
                        <td>
                          <span className={`badge ${
                            log.status === "Authorized" ? "badge-approved" : log.status === "Rejected" ? "badge-rejected" : "badge-pending"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          {log.authorized_by_admin ? (
                            <span style={{ fontSize: "0.75rem", color: "var(--success-text)" }}>
                              {log.authorized_by_admin}
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          {log.status === "Pending" ? (
                            <div className="action-buttons">
                              <button onClick={() => handleAuthorizeAttendance(log.id, "Authorized")} className="btn-action-approve">
                                Authorize
                              </button>
                              <button onClick={() => handleAuthorizeAttendance(log.id, "Rejected")} className="btn-action-reject">
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Complete</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Job Listings */}
      {activeTab === "jobs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="panel-card">
            <h3>Publish New Job Opportunity</h3>
            <form onSubmit={handleCreateJob} className="job-create-form">
              <div className="form-group">
                <label>Job Title *</label>
                <input type="text" required placeholder="e.g. Senior Fullstack Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input type="text" required placeholder="e.g. Bangalore, Karnataka" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label>Salary Range *</label>
                <input type="text" required placeholder="e.g. ₹12,00,000 - ₹18,00,000 P.A." value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label>Job Type</label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="form-input">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="form-group col-span-2">
                <label>Job Description *</label>
                <textarea rows="3" required placeholder="Brief summary of duties and responsibilities..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-input" style={{ resize: "vertical" }} />
              </div>
              <div className="form-group col-span-2">
                <label>Requirements *</label>
                <textarea rows="3" required placeholder="Key technical skills, certifications, and experience level..." value={jobRequirements} onChange={(e) => setJobRequirements(e.target.value)} className="form-input" style={{ resize: "vertical" }} />
              </div>
              <button type="submit" className="btn-primary col-span-2" style={{ marginTop: "0.5rem" }}>
                Publish Listing
              </button>
            </form>
          </div>

          <div className="panel-card">
            <h3>Active Job Board</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Salary Range</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-text">No active job listings found.</td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{job.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {job.description}
                          </div>
                        </td>
                        <td>{job.location}</td>
                        <td>{job.salary_range || "Not Specified"}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                            {job.job_type}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteJob(job.id)} className="btn-delete">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Candidate Applications */}
      {activeTab === "applications" && (
        <div className="panel-card">
          <h3>Submitted Candidate Applications</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant Details</th>
                  <th>Position Applied</th>
                  <th>Experience</th>
                  <th>Resume</th>
                  <th>Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-text">No candidate applications submitted yet.</td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{app.email} | {app.phone}</div>
                        {app.cover_letter && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>
                            "{app.cover_letter}"
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{app.job_title || "General Application"}</td>
                      <td>{app.experience}</td>
                      <td>
                        {app.resume_url ? (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--accent-pink)", fontWeight: 600, textDecoration: "underline" }}
                          >
                            View Resume
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>No Link Provided</span>
                        )}
                      </td>
                      <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Client Hiring Inquiries */}
      {activeTab === "requests" && (
        <div className="panel-card">
          <h3>Employer Hiring Support Inquiries</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employer / Representative</th>
                  <th>Company Name</th>
                  <th>Requirements Detail</th>
                  <th>Contact Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-text">No client hiring requests received yet.</td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{req.contact_person}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{req.email} | {req.phone}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--accent-pink)" }}>{req.company_name}</td>
                      <td style={{ maxWidth: "400px", lineHeight: "1.4" }}>{req.requirements}</td>
                      <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Salary Sheets */}
      {activeTab === "salary_sheets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Monthly Employee Salary Sheets</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Review live calculated payroll details for registered employee profiles.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={fetchEmployees} className="btn-logout" style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}>
                  Refresh List
                </button>
                <button onClick={handleDownloadSalaryExcel} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
                  📥 Download Excel Report
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SL No.</th>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Designation</th>
                    <th>Gross Salary</th>
                    <th>Days Payable</th>
                    <th>Net Take Home</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-text">No employee profile data found.</td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => {
                      const fixedGross = Number(emp.fixed_gross_salary) || 0;
                      const basic = Number(emp.basic_salary) || 0;
                      const hra = Number(emp.hra) || 0;
                      const conveyance = Number(emp.conveyance_allowance) || 0;
                      const medical = Number(emp.medical_allowance) || 0;
                      const days = Number(emp.days_payable) || 30;

                      const earnedBasic = (basic / 30) * days;
                      const earnedHra = (hra / 30) * days;
                      const earnedConveyance = (conveyance / 30) * days;
                      const earnedMedical = (medical / 30) * days;
                      const earnedGross = earnedBasic + earnedHra + earnedConveyance + earnedMedical;

                      const pt = earnedGross > 15000 ? 200 : 0;
                      const netTakeHome = earnedGross - pt;

                      return (
                        <tr key={emp.id}>
                          <td>{index + 1}</td>
                          <td style={{ fontFamily: "monospace", color: "var(--accent-pink)", fontWeight: 600 }}>{emp.employee_id || "—"}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{emp.email}</div>
                          </td>
                          <td>{emp.branch || "—"}</td>
                          <td>{emp.designation || "—"}</td>
                          <td>₹{fixedGross.toLocaleString()}</td>
                          <td>{days}</td>
                          <td style={{ fontWeight: 700, color: "var(--success-text)" }}>₹{Math.round(netTakeHome).toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Performance Tracker */}
      {activeTab === "performance_tracker" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Candidate Performance Review Tracker</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  View daily logs of candidate offers, recruitment updates, and status entries submitted by employees/recruiters.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={fetchAdminTrackerRecords} className="btn-logout" style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}>
                  Refresh Log
                </button>
                <button onClick={handleDownloadTrackerExcel} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
                  📥 Download Excel Log
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>Candidate Details</th>
                    <th>Mobile</th>
                    <th>Client Name</th>
                    <th>Recruiter Name</th>
                    <th>Recruiter Emp ID</th>
                    <th>DOJ</th>
                    <th>HR Confirmation</th>
                    <th>Mgr Approved</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {adminTrackerRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-text">No candidate entries logged yet.</td>
                    </tr>
                  ) : (
                    adminTrackerRecords.map((rec, index) => (
                      <tr key={rec.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{rec.candidate_name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{rec.applied_designation || "General"}</div>
                        </td>
                        <td style={{ fontFamily: "monospace" }}>{rec.mobile_number}</td>
                        <td>{rec.client_name}</td>
                        <td>{rec.recruiter_name}</td>
                        <td style={{ fontFamily: "monospace", color: "var(--accent-pink)" }}>{rec.recruiter_employee_id || "—"}</td>
                        <td>{rec.candidate_doj ? new Date(rec.candidate_doj).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={`badge ${rec.hr_confirmation_mail === 'Yes' ? 'badge-approved' : 'badge-rejected'}`}>
                            {rec.hr_confirmation_mail}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${rec.team_manager_approved === 'Yes' ? 'badge-approved' : 'badge-rejected'}`}>
                            {rec.team_manager_approved}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${rec.joined === 'Yes' ? 'badge-approved' : 'badge-pending'}`}>
                            {rec.joined}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Daily Self-Ratings */}
      {activeTab === "daily_ratings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Filters Bar Card */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Search & Filters</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Filter the self-rating records and monthly summaries below.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>Recruiter Name or Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe, EMP-1001"
                  value={ratingSearchQuery}
                  onChange={(e) => setRatingSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>Rating Color</label>
                <select
                  value={ratingColorFilter}
                  onChange={(e) => setRatingColorFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "100%" }}
                >
                  <option value="All">All Ratings</option>
                  <option value="Green">Green (With Joinings)</option>
                  <option value="Red">Red (No Joinings)</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: "150px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>Month</label>
                <input
                  type="text"
                  placeholder="e.g. May 2026"
                  value={ratingMonthFilter}
                  onChange={(e) => setRatingMonthFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Monthly Summary Checklist Indicator (Target < 6 is RED) */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Recruiter Monthly Joining Target Checklist</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  A recruiter requires a minimum of <strong>6 candidate joinings</strong> in a month to achieve a GREEN status. Less than 6 joinings defaults to <strong>RED</strong>.
                </p>
              </div>
              <button 
                onClick={fetchAdminDailyRatingsSummary} 
                className="btn-logout" 
                style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}
              >
                Refresh
              </button>
            </div>
            
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recruiter ID</th>
                    <th>Recruiter Name</th>
                    <th>Month</th>
                    <th>Total Joinings</th>
                    <th>Status Check</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = adminDailyRatingsSummary.filter(row => {
                      const matchesSearch = !ratingSearchQuery.trim() || 
                        (row.name && row.name.toLowerCase().includes(ratingSearchQuery.toLowerCase())) ||
                        (row.employee_id && row.employee_id.toLowerCase().includes(ratingSearchQuery.toLowerCase()));
                        
                      const matchesMonth = !ratingMonthFilter.trim() ||
                        (row.month && row.month.toLowerCase().includes(ratingMonthFilter.toLowerCase()));
                        
                      return matchesSearch && matchesMonth;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="5" className="empty-text">No monthly targets computed yet.</td>
                        </tr>
                      );
                    }

                    return filtered.map((row, index) => {
                      const totalJoinings = parseInt(row.total_joinings) || 0;
                      const metTarget = totalJoinings >= 6;
                      return (
                        <tr key={index}>
                          <td style={{ fontFamily: "monospace", color: "var(--accent-pink)", fontWeight: 600 }}>{row.employee_id}</td>
                          <td style={{ fontWeight: 600 }}>{row.name}</td>
                          <td>{row.month}</td>
                          <td style={{ fontWeight: 700, fontSize: "1rem" }}>{totalJoinings}</td>
                          <td>
                            {metTarget ? (
                              <span style={{ 
                                padding: "0.25rem 0.75rem", 
                                borderRadius: "999px", 
                                fontSize: "0.7rem", 
                                fontWeight: 700, 
                                backgroundColor: "rgba(16, 185, 129, 0.15)", 
                                color: "#10B981", 
                                border: "1px solid rgba(16, 185, 129, 0.3)" 
                              }}>
                                🟢 GREEN (Met Target)
                              </span>
                            ) : (
                              <span style={{ 
                                padding: "0.25rem 0.75rem", 
                                borderRadius: "999px", 
                                fontSize: "0.7rem", 
                                fontWeight: 700, 
                                backgroundColor: "rgba(239, 68, 68, 0.15)", 
                                color: "#EF4444", 
                                border: "1px solid rgba(239, 68, 68, 0.3)" 
                              }}>
                                🔴 RED (Below Target)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complete Logs */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3>Recruiter Daily Ratings & Joinings Log</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Historical logs of all employee daily self-ratings and candidate lists.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={fetchAdminDailyRatings} className="btn-logout" style={{ border: "1px solid var(--accent-pink)", color: "var(--accent-pink)" }}>
                  Refresh Logs
                </button>
                <button onClick={handleDownloadDailyRatingsExcel} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.8rem" }}>
                  📥 Download Excel Report
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>Date</th>
                    <th>Recruiter</th>
                    <th>Indicator Rating</th>
                    <th>No. of Joinings</th>
                    <th>Registered Candidates</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = adminDailyRatings.filter(rec => {
                      const matchesSearch = !ratingSearchQuery.trim() || 
                        (rec.employee_name && rec.employee_name.toLowerCase().includes(ratingSearchQuery.toLowerCase())) ||
                        (rec.emp_code && rec.emp_code.toLowerCase().includes(ratingSearchQuery.toLowerCase()));
                        
                      const matchesColor = ratingColorFilter === "All" || rec.rating_color === ratingColorFilter;
                      
                      const matchesMonth = !ratingMonthFilter.trim() ||
                        (rec.joinings && rec.joinings.some(j => j.month && j.month.toLowerCase().includes(ratingMonthFilter.toLowerCase())));
                        
                      return matchesSearch && matchesColor && matchesMonth;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" className="empty-text">No self-rating logs matched search filters.</td>
                        </tr>
                      );
                    }

                    return filtered.map((rec, index) => {
                      const rDate = new Date(rec.rating_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      });

                      return (
                        <React.Fragment key={rec.id}>
                          <tr>
                            <td>{index + 1}</td>
                            <td style={{ fontWeight: 600 }}>{rDate}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{rec.employee_name}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>ID: {rec.emp_code}</div>
                            </td>
                            <td>
                              <span style={{ 
                                padding: "0.2rem 0.5rem", 
                                borderRadius: "999px", 
                                fontSize: "0.65rem", 
                                fontWeight: 700,
                                backgroundColor: rec.rating_color === "Green" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: rec.rating_color === "Green" ? "#10B981" : "#EF4444",
                                border: rec.rating_color === "Green" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                              }}>
                                {rec.rating_color === "Green" ? "🟢 Green" : "🔴 Red"}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>{rec.joinings ? rec.joinings.length : 0}</td>
                            <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              {rec.joinings && rec.joinings.length > 0 ? "Expand row below to view list" : "—"}
                            </td>
                          </tr>
                          {rec.joinings && rec.joinings.length > 0 && (
                            <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                              <td colSpan="6" style={{ padding: "1rem" }}>
                                <div style={{ 
                                  border: "1px solid rgba(255, 255, 255, 0.05)", 
                                  borderRadius: "12px", 
                                  padding: "1rem", 
                                  backgroundColor: "rgba(0, 0, 0, 0.2)" 
                                }}>
                                  <h4 style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-pink)", margin: "0 0 0.75rem 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Joined Candidates Detailed List
                                  </h4>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                                    {rec.joinings.map((joining, jIdx) => (
                                      <div key={jIdx} style={{ 
                                        backgroundColor: "rgba(255, 255, 255, 0.03)", 
                                        padding: "0.75rem", 
                                        borderRadius: "8px", 
                                        border: "1px solid rgba(255, 255, 255, 0.05)", 
                                        fontSize: "0.7rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.25rem"
                                      }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "0.25rem", fontWeight: 700 }}>
                                          <span style={{ color: "#fff" }}>{joining.candidate_name}</span>
                                          <span style={{ color: "var(--accent-pink)", fontFamily: "monospace" }}>{joining.mobile_number}</span>
                                        </div>
                                        <div style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>Client: <strong style={{ color: "#fff" }}>{joining.client_name}</strong></div>
                                        <div style={{ color: "var(--text-secondary)" }}>Designation: <strong style={{ color: "#fff" }}>{joining.designation}</strong></div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", paddingTop: "0.25rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "0.6rem", color: "var(--text-secondary)" }}>
                                          <span>📍 {joining.location}</span>
                                          <span>📅 {joining.month}</span>
                                          <span>Emp ID: {joining.emp_id}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT: SELECTION TRACKER
          ========================================== */}
      {activeTab === "selection_tracker" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="panel-card">
            <div className="panel-header" style={{ marginBottom: "1.5rem" }}>
              <div className="header-left">
                <h3>🎯 Selection Tracker</h3>
                <p>View selection targets and download tracking reports for employees.</p>
              </div>
              <div className="header-actions" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <select
                  value={selectionMonth}
                  onChange={(e) => {
                    setSelectionMonth(e.target.value);
                    if (selectedEmployeeForDetails) {
                      fetchSelectionDetails(selectedEmployeeForDetails, e.target.value);
                    } else {
                      fetchSelectionSummary(e.target.value);
                    }
                  }}
                  className="form-input"
                  style={{ width: "auto" }}
                >
                  {[0, 1, 2, 3].map(i => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const m = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{m}</option>;
                  })}
                </select>
                <button
                  onClick={() => handleDownloadSelectionTracker(selectedEmployeeForDetails)}
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  📥 Download Excel
                </button>
                {selectedEmployeeForDetails && (
                  <button onClick={() => { setSelectedEmployeeForDetails(null); fetchSelectionSummary(selectionMonth); }} className="btn-secondary">
                    Back to Summary
                  </button>
                )}
              </div>
            </div>

            {selectedEmployeeForDetails ? (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Candidate</th>
                      <th>Client</th>
                      <th>Mobile</th>
                      <th>Selection Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectionDetails.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)" }}>No selection entries found for this employee this month.</td></tr>
                    ) : (
                      selectionDetails.map((rec, i) => (
                        <tr key={i}>
                          <td>{new Date(rec.created_at).toLocaleDateString("en-IN")}</td>
                          <td><strong>{rec.candidate_name}</strong></td>
                          <td>{rec.client_name}</td>
                          <td style={{ fontFamily: "monospace" }}>{rec.mobile_number}</td>
                          <td>
                            <span className={`status-badge ${rec.selected === "Yes" ? "status-active" : "status-resigned"}`}>
                              {rec.selected}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Total Selections</th>
                      <th>Score</th>
                      <th>Status (Target: 20)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectionSummary.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)" }}>No data available for this month.</td></tr>
                    ) : (
                      selectionSummary.map((rec, i) => (
                        <tr key={i}>
                          <td><strong>{rec.employee_name}</strong></td>
                          <td>{rec.yes_count}</td>
                          <td><strong>{rec.score}%</strong></td>
                          <td>
                            <span className={`status-badge ${rec.status === "Green" ? "status-active" : "status-resigned"}`}>
                              {rec.status === "Green" ? "🟢 Green" : "🔴 Red"}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => fetchSelectionDetails(rec.employee_id, selectionMonth)}
                              className="btn-action btn-view"
                              title="View Entries"
                            >
                              👁️ View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT: SETTINGS (Email + Reset Password)
          ========================================== */}
      {activeTab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Email Settings */}
          <div className="panel-card" style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
            <h3>Admin Notification Settings</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Configure the email address that will receive administrative notifications.
            </p>
            <form onSubmit={handleUpdateAdminEmail} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Admin Notification Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@milliontalentstech.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="form-input"
                />
                <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  All future Admin notification emails will be sent to this address.
                </span>
              </div>
              
              <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2rem" }}>
                {loading ? "Saving Settings..." : "Save Settings"}
              </button>
            </form>
          </div>

          {/* Reset Password */}
          <div className="panel-card" style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>🔒 Reset Password</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Change your admin password. Enter your current password and a new password below.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setSuccess("");
              if (resetNewPassword !== resetConfirmPassword) {
                setError("New password and confirm password do not match.");
                return;
              }
              if (resetNewPassword.length < 6) {
                setError("New password must be at least 6 characters.");
                return;
              }
              setLoading(true);
              try {
                const res = await fetch(`${BACKEND_URL}/api/admin/reset-password`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    current_password: resetCurrentPassword,
                    new_password: resetNewPassword,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Password reset failed");
                setSuccess(data.message || "Password changed successfully!");
                setResetCurrentPassword("");
                setResetNewPassword("");
                setResetConfirmPassword("");
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={resetCurrentPassword}
                  onChange={(e) => setResetCurrentPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2rem" }}>
                {loading ? "Changing Password..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
