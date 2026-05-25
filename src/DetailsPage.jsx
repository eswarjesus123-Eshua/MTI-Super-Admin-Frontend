import React from 'react';
import { ArrowLeft, User, Phone, Mail, Calendar, Briefcase, FileText, Banknote, MapPin, Building, CreditCard, BookOpen, Star } from 'lucide-react';

export default function DetailsPage({ details, onBack }) {
  if (!details || !details.data) return null;

  const { type, data } = details;

  // Helper to render a generic key-value pair
  const renderField = (icon, label, value) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(108, 92, 231, 0.1)' }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            {label}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            {value}
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeDetails = () => (
    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
      
      {/* Basic Information */}
      <div className="details-card panel-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <User size={20} color="var(--accent-color)" /> Basic Information
        </h3>
        {renderField(<User size={18} />, "Full Name", data.name)}
        {renderField(<Mail size={18} />, "Email Address", data.email)}
        {renderField(<Phone size={18} />, "Mobile Number", data.phone)}
        {renderField(<Calendar size={18} />, "Date of Joining", data.doj ? new Date(data.doj).toLocaleDateString() : null)}
        {renderField(<MapPin size={18} />, "Address", data.address)}
        {renderField(<User size={18} />, "Gender", data.gender)}
        {renderField(<Calendar size={18} />, "Date of Birth", data.dob ? new Date(data.dob).toLocaleDateString() : null)}
      </div>

      {/* Professional Details */}
      <div className="details-card panel-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Briefcase size={20} color="var(--accent-color)" /> Professional Details
        </h3>
        {renderField(<Briefcase size={18} />, "Designation", data.designation)}
        {renderField(<User size={18} />, "Reporting Manager", data.reporting_manager)}
        {renderField(<BookOpen size={18} />, "Employee ID", data.employee_id)}
        {renderField(<Building size={18} />, "Branch", data.branch)}
        {renderField(<FileText size={18} />, "Aadhaar Number", data.aadhaar)}
        {renderField(<FileText size={18} />, "PAN Number", data.pan)}
      </div>

      {/* Financial Details */}
      <div className="details-card panel-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Banknote size={20} color="var(--accent-color)" /> Payroll & Salary
        </h3>
        {renderField(<Banknote size={18} />, "Fixed Gross Salary", data.fixed_gross_salary ? `₹${Number(data.fixed_gross_salary).toLocaleString()}` : null)}
        {renderField(<Banknote size={18} />, "Basic Salary", data.basic_salary ? `₹${Number(data.basic_salary).toLocaleString()}` : null)}
        {renderField(<Banknote size={18} />, "HRA", data.hra ? `₹${Number(data.hra).toLocaleString()}` : null)}
        {renderField(<Banknote size={18} />, "Conveyance Allowance", data.conveyance_allowance ? `₹${Number(data.conveyance_allowance).toLocaleString()}` : null)}
        {renderField(<Banknote size={18} />, "Medical Allowance", data.medical_allowance ? `₹${Number(data.medical_allowance).toLocaleString()}` : null)}
        {renderField(<Calendar size={18} />, "Days Payable", data.days_payable)}
        {renderField(<FileText size={18} />, "PF / ESI / EL", data.pf_esi_el)}
      </div>

      {/* Bank Details */}
      <div className="details-card panel-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <CreditCard size={20} color="var(--accent-color)" /> Bank Information
        </h3>
        {renderField(<Building size={18} />, "Bank Name", data.bank_name)}
        {renderField(<CreditCard size={18} />, "Account Number", data.account_number)}
        {renderField(<CreditCard size={18} />, "IFSC Code", data.ifsc_code)}
        {renderField(<MapPin size={18} />, "Bank Branch", data.bank_branch_name)}
        {renderField(<User size={18} />, "Name as per Records", data.name_as_per_records)}
        {renderField(<User size={18} />, "Father's Name", data.father_name)}
      </div>

    </div>
  );

  const renderCandidateDetails = () => {
    // Candidate data can come from different tables. Let's handle generic candidate data mapping.
    const name = data.name || data.candidate_name;
    const email = data.email || data.candidate_email;
    const phone = data.phone || data.mobile_number;
    const designation = data.designation;
    const location = data.location;
    
    return (
      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Basic Information */}
        <div className="details-card panel-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <User size={20} color="var(--accent-color)" /> Candidate Profile
          </h3>
          {renderField(<User size={18} />, "Candidate Name", name)}
          {renderField(<Mail size={18} />, "Email Address", email)}
          {renderField(<Phone size={18} />, "Mobile Number", phone)}
          {renderField(<Briefcase size={18} />, "Designation / Role", designation)}
          {renderField(<MapPin size={18} />, "Location", location)}
          {renderField(<Briefcase size={18} />, "Experience", data.experience)}
        </div>

        {/* Application / Tracker Details */}
        <div className="details-card panel-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <FileText size={20} color="var(--accent-color)" /> Application Details
          </h3>
          {renderField(<Building size={18} />, "Client Name", data.client_name)}
          {renderField(<User size={18} />, "Recruiter Name", data.employee_name || data.recruiter_name)}
          {renderField(<User size={18} />, "Client HR Name", data.client_hr_name)}
          {renderField(<Banknote size={18} />, "Expected Salary", data.expected_salary)}
          {renderField(<Banknote size={18} />, "Target Salary", data.target_salary)}
          {renderField(<Star size={18} />, "Status / Selected", data.status || data.selected)}
          {renderField(<Calendar size={18} />, "Date / Month", data.created_at ? new Date(data.created_at).toLocaleDateString() : data.month)}
          {renderField(<BookOpen size={18} />, "Portfolio Link", data.portfolio_link)}
          {renderField(<FileText size={18} />, "Notes", data.note)}
        </div>

      </div>
    );
  };

  return (
    <div className="details-page-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={onBack} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            {type === 'employee' ? 'Employee Details' : 'Candidate Details'}
          </h2>
        </div>
      </div>
      
      {type === 'employee' ? renderEmployeeDetails() : renderCandidateDetails()}
    </div>
  );
}
